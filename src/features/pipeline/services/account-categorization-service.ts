import { invokeClaudeOnBedrock } from "@/lib/bedrock/client";
import prisma from "@/lib/prisma/client";

import {
  VALID_CATEGORIES,
  type ProjectCategory,
} from "@/features/projects/config/categories";

const BATCH_SIZE = 2;

const CATEGORIZATION_SYSTEM = `You are an email analyst. Given a domain and recent email subjects/snippets, classify the sender into one of three categories:

- SALES: A real person or company with a direct commercial relationship — active vendors, suppliers, clients, partners, recruiters reaching out personally, or SaaS tools you are actively evaluating/using with a sales rep. The key signal is TWO-WAY communication or personalized outreach, not mass emails.
- MANAGEMENT: Internal management, HR systems, payroll, company announcements, internal tools, IT admin notifications, workspace/office management.
- OTHER: Everything else — newsletters, marketing blasts, subscription digests, automated notifications, social media alerts, one-way promotional emails, transactional emails (receipts, confirmations), and personal contacts.

IMPORTANT: Mass marketing emails, newsletters, and subscription content are ALWAYS "OTHER", even if they come from a company that sells things. The distinction is whether there is a direct, personal commercial relationship vs. one-way broadcast content.

Respond with ONLY valid JSON: {"category": "SALES"|"MANAGEMENT"|"OTHER", "reason": "brief explanation"}`;

interface CategorizationResult {
  category: ProjectCategory;
  reason: string;
}

export class AccountCategorizationService {
  /**
   * Categorizes accounts in batches. After each batch, calls onBatchDone
   * with IDs of any newly-categorized SALES accounts so exploration
   * can start in parallel.
   */
  static async categorizeAccounts(
    emailAccountId: string,
    onBatchDone?: (salesAccountIds: string[]) => void,
  ): Promise<number> {
    const uncategorized = await prisma.discoveredAccount.findMany({
      where: {
        emailAccountId,
        category: null,
      },
    });

    let categorized = 0;

    for (let i = 0; i < uncategorized.length; i += BATCH_SIZE) {
      const batch = uncategorized.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((account) => this.categorizeOne(account.id, emailAccountId, account.domain)),
      );

      const batchSalesIds: string[] = [];
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === "fulfilled") {
          categorized++;
          // Check if this one was categorized as SALES
          const updated = await prisma.discoveredAccount.findUnique({
            where: { id: batch[j].id },
            select: { category: true },
          });
          if (updated?.category === "SALES") {
            batchSalesIds.push(batch[j].id);
          }
        }
      }

      if (batchSalesIds.length > 0 && onBatchDone) {
        onBatchDone(batchSalesIds);
      }
    }

    return categorized;
  }

  private static async categorizeOne(
    accountId: string,
    emailAccountId: string,
    domain: string,
  ): Promise<void> {
    const recentMessages = await prisma.emailMessage.findMany({
      where: {
        accountId: emailAccountId,
        fromAddress: { contains: `@${domain}` },
      },
      select: {
        subject: true,
        snippet: true,
        date: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    const emailSummary = recentMessages
      .map((m) => `- Subject: ${m.subject || "(no subject)"} | Preview: ${m.snippet || ""}`)
      .join("\n");

    const prompt = `Domain: ${domain}\n\nRecent emails from this domain:\n${emailSummary}\n\nClassify this sender organization.`;

    try {
      const response = await invokeClaudeOnBedrock({
        system: CATEGORIZATION_SYSTEM,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 256,
      });

      const parsed = parseCategorizationResponse(response);

      await prisma.discoveredAccount.update({
        where: { id: accountId },
        data: {
          category: parsed.category,
          categoryReason: parsed.reason,
          categorizedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to categorize domain ${domain}:`, error);
      await prisma.discoveredAccount.update({
        where: { id: accountId },
        data: {
          category: "OTHER",
          categoryReason: "Categorization failed — defaulted to OTHER",
          categorizedAt: new Date(),
        },
      });
    }
  }
}

function parseCategorizationResponse(response: string): CategorizationResult {
  const jsonMatch = response.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return { category: "OTHER", reason: "Could not parse LLM response" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? (parsed.category as ProjectCategory)
      : "OTHER";
    return {
      category,
      reason: parsed.reason || "No reason provided",
    };
  } catch {
    return { category: "OTHER", reason: "Could not parse LLM response" };
  }
}
