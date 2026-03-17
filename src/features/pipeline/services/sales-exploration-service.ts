import { invokeClaudeOnBedrock } from "@/lib/bedrock/client";
import prisma from "@/lib/prisma/client";

const BATCH_SIZE = 2;
const BODY_TRUNCATE_LENGTH = 500;

const EXPLORATION_SYSTEM = `You are a CRM analyst. Given email conversations with a sales/vendor organization, extract structured insights about the commercial relationship.

Respond with ONLY valid JSON:
{
  "contacts": [{"name": "...", "email": "...", "role": "..."}],
  "dealStage": "prospecting" | "evaluation" | "negotiation" | "closed-won" | "closed-lost" | "active-customer" | "churned" | "unknown",
  "recentActivitySummary": "2-3 sentence summary of recent interactions",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`;

interface SalesInsights {
  contacts: Array<{ name: string; email: string; role: string }>;
  dealStage: string;
  recentActivitySummary: string;
  keyTopics: string[];
}

export class SalesExplorationService {
  static async exploreSalesAccounts(emailAccountId: string): Promise<number> {
    const salesAccounts = await prisma.discoveredAccount.findMany({
      where: {
        emailAccountId,
        category: "SALES",
        salesInsights: null,
      },
    });

    let explored = 0;

    for (let i = 0; i < salesAccounts.length; i += BATCH_SIZE) {
      const batch = salesAccounts.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((account) => this.exploreOne(account.id, emailAccountId, account.domain)),
      );

      for (const result of results) {
        if (result.status === "fulfilled") explored++;
      }
    }

    return explored;
  }

  /** Explore specific account IDs — used for parallel exploration during categorization */
  static async exploreAccountsByIds(
    emailAccountId: string,
    accountIds: string[],
  ): Promise<void> {
    const accounts = await prisma.discoveredAccount.findMany({
      where: {
        id: { in: accountIds },
        emailAccountId,
        salesInsights: null,
      },
    });

    for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
      const batch = accounts.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((account) => this.exploreOne(account.id, emailAccountId, account.domain)),
      );
    }
  }

  private static async exploreOne(
    accountId: string,
    emailAccountId: string,
    domain: string,
  ): Promise<void> {
    // Fetch recent messages with body text
    const recentMessages = await prisma.emailMessage.findMany({
      where: {
        accountId: emailAccountId,
        OR: [
          { fromAddress: { contains: `@${domain}` } },
          {
            addresses: {
              some: {
                type: "TO",
                address: { contains: `@${domain}` },
              },
            },
          },
        ],
      },
      select: {
        subject: true,
        snippet: true,
        fromName: true,
        fromAddress: true,
        date: true,
        body: {
          select: { text: true },
        },
        addresses: {
          where: { type: "TO" },
          select: { address: true, name: true },
        },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    const emailContext = recentMessages
      .map((m) => {
        const bodyText = m.body?.text
          ? m.body.text.substring(0, BODY_TRUNCATE_LENGTH)
          : "";
        const toAddresses = m.addresses.map((a) => `${a.name || ""} <${a.address}>`).join(", ");
        return `From: ${m.fromName || ""} <${m.fromAddress || ""}>
To: ${toAddresses}
Date: ${m.date?.toISOString() || "unknown"}
Subject: ${m.subject || "(no subject)"}
Body: ${bodyText}
---`;
      })
      .join("\n");

    const prompt = `Domain: ${domain}\n\nEmail conversations:\n${emailContext}\n\nExtract CRM insights about this sales relationship.`;

    try {
      const response = await invokeClaudeOnBedrock({
        system: EXPLORATION_SYSTEM,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1024,
      });

      const insights = parseExplorationResponse(response);

      await prisma.discoveredAccount.update({
        where: { id: accountId },
        data: {
          salesInsights: JSON.stringify(insights),
          exploredAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to explore sales domain ${domain}:`, error);
    }
  }
}

function parseExplorationResponse(response: string): SalesInsights {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      contacts: [],
      dealStage: "unknown",
      recentActivitySummary: "Could not parse analysis",
      keyTopics: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      dealStage: parsed.dealStage || "unknown",
      recentActivitySummary: parsed.recentActivitySummary || "",
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
    };
  } catch {
    return {
      contacts: [],
      dealStage: "unknown",
      recentActivitySummary: "Could not parse analysis",
      keyTopics: [],
    };
  }
}
