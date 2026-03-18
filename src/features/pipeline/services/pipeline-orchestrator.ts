import prisma from "@/lib/prisma/client";

import { AccountCategorizationService } from "./account-categorization-service";
import { AccountDiscoveryService } from "./account-discovery-service";
import { SalesExplorationService } from "./sales-exploration-service";

export class PipelineOrchestrator {
  /**
   * Phase 1: Discovery + Categorization only.
   * Runs on lightweight metadata — no email bodies needed.
   * Completes in seconds so the user sees results fast.
   */
  static async runForAccount(emailAccountId: string): Promise<string> {
    let run = await prisma.pipelineRun.findFirst({
      where: { emailAccountId, status: "RUNNING" },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      run = await prisma.pipelineRun.create({
        data: {
          emailAccountId,
          status: "RUNNING",
          stage: "DISCOVERY",
        },
      });
    }

    try {
      const pipelineStart = performance.now();

      // Stage 1: Discovery
      const discoveryStart = performance.now();
      const accountsFound = await AccountDiscoveryService.discoverAccounts(emailAccountId);
      const discoveryMs = Math.round(performance.now() - discoveryStart);

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          stage: "CATEGORIZATION",
          accountsFound,
          discoveryMs,
        },
      });

      // Stage 2: Categorization (no exploration yet — need full bodies first)
      const categorizationStart = performance.now();
      const { categorized: accountsCategorized, autoSkipped: autoSkippedCount } =
        await AccountCategorizationService.categorizeAccounts(emailAccountId);
      const categorizationMs = Math.round(performance.now() - categorizationStart);

      const totalMs = Math.round(performance.now() - pipelineStart);

      console.log(
        `[Pipeline] ${emailAccountId} — discovery: ${discoveryMs}ms, categorization: ${categorizationMs}ms, total: ${totalMs}ms (found: ${accountsFound}, categorized: ${accountsCategorized}, autoSkipped: ${autoSkippedCount})`,
      );

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          stage: "COMPLETED",
          status: "COMPLETED",
          accountsCategorized,
          autoSkippedCount,
          categorizationMs,
          totalMs,
          completedAt: new Date(),
        },
      });

      return run.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Pipeline failed for account ${emailAccountId}:`, error);

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      return run.id;
    }
  }

  /**
   * Phase 2: Exploration for SALES accounts.
   * Runs after targeted full sync has fetched email bodies for SALES domains.
   */
  static async runExploration(emailAccountId: string): Promise<void> {
    console.log(`[Pipeline] Starting exploration phase for ${emailAccountId}`);
    const explorationStart = performance.now();

    try {
      const salesAccounts = await prisma.discoveredAccount.findMany({
        where: {
          emailAccountId,
          category: "SALES",
          salesInsights: null,
        },
      });

      if (salesAccounts.length === 0) {
        console.log("[Pipeline] No unexplored SALES accounts, skipping exploration");
        return;
      }

      const explored = await SalesExplorationService.exploreSalesAccounts(emailAccountId);
      const explorationMs = Math.round(performance.now() - explorationStart);

      // Update the most recent completed run with exploration timing
      const latestRun = await prisma.pipelineRun.findFirst({
        where: { emailAccountId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      });

      if (latestRun) {
        await prisma.pipelineRun.update({
          where: { id: latestRun.id },
          data: { salesExplored: explored, explorationMs },
        });
      }

      console.log(`[Pipeline] Exploration complete: ${explored} accounts in ${explorationMs}ms`);
    } catch (error) {
      console.error(`Exploration phase failed for ${emailAccountId}:`, error);
    }
  }
}
