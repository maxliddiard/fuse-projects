import prisma from "@/lib/prisma/client";

import { AccountCategorizationService } from "./account-categorization-service";
import { AccountDiscoveryService } from "./account-discovery-service";
import { SalesExplorationService } from "./sales-exploration-service";

export class PipelineOrchestrator {
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
      // Stage 1: Discovery
      const accountsFound = await AccountDiscoveryService.discoverAccounts(emailAccountId);
      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          stage: "CATEGORIZATION",
          accountsFound,
        },
      });

      // Stage 2 + 3: Categorization with parallel exploration.
      // As each categorization batch finishes, any SALES accounts
      // are immediately sent to exploration without waiting for
      // the remaining accounts to be categorized.
      const explorationPromises: Promise<void>[] = [];

      const accountsCategorized = await AccountCategorizationService.categorizeAccounts(
        emailAccountId,
        (salesAccountIds) => {
          // Fire off exploration for this batch of SALES accounts immediately
          const promise = SalesExplorationService.exploreAccountsByIds(
            emailAccountId,
            salesAccountIds,
          ).catch((err) => {
            console.error("Parallel exploration batch failed:", err);
          });
          explorationPromises.push(promise);
        },
      );

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          stage: "EXPLORATION",
          accountsCategorized,
        },
      });

      // Wait for any in-flight exploration batches to finish
      await Promise.allSettled(explorationPromises);

      const salesExplored = await prisma.discoveredAccount.count({
        where: {
          emailAccountId,
          category: "SALES",
          exploredAt: { not: null },
        },
      });

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          stage: "COMPLETED",
          status: "COMPLETED",
          salesExplored,
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
}
