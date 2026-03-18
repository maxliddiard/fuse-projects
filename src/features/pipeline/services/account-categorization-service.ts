import { invokeClaudeOnBedrock, type BedrockModel } from "@/lib/bedrock/client";
import prisma from "@/lib/prisma/client";

import {
  VALID_CATEGORIES,
  type ProjectCategory,
} from "@/features/projects/config/categories";

const DOMAINS_PER_CALL = 30;
const CATEGORIZATION_MODEL: BedrockModel = "haiku";

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
  "icloud.com", "aol.com", "protonmail.com", "live.com",
  "me.com", "msn.com", "mail.com",
]);

const CATEGORIZATION_SYSTEM = `You are an email analyst. You are given a list of domains that a user has SENT emails to, along with the subjects/snippets of those outbound messages. Classify each domain into one of these categories:

- SALES: Healthcare providers, clinics, practices, potential clients, or companies with a direct commercial/sales relationship. The user is selling to or partnering with these organizations.
- INVESTOR: Venture capital firms, angel investors, accelerators, investment funds, or fundraising-related contacts.
- SUPPLIER: Vendors, service providers, contractors, or tools the user is buying from or evaluating (accounting firms, legal, SaaS tools, consultants).
- MANAGEMENT: Internal team, HR systems, payroll, company admin, workspace/office management, internal tools.
- OTHER: Personal contacts, generic email providers, newsletters, social media, or anything that doesn't fit the above.

IMPORTANT: Domains like gmail.com, yahoo.com, outlook.com, hotmail.com are personal email — classify as OTHER unless the subjects clearly indicate otherwise.

Respond with ONLY a valid JSON array, one entry per domain in the same order:
[{"domain": "example.com", "category": "SALES"|"INVESTOR"|"SUPPLIER"|"MANAGEMENT"|"OTHER", "reason": "brief explanation"}, ...]`;

interface CategorizationResult {
  domain: string;
  category: ProjectCategory;
  reason: string;
}

interface DomainWithEmails {
  accountId: string;
  domain: string;
  emailSummary: string;
}

export class AccountCategorizationService {
  static async categorizeAccounts(
    emailAccountId: string,
  ): Promise<{ categorized: number; autoSkipped: number }> {
    const uncategorized = await prisma.discoveredAccount.findMany({
      where: {
        emailAccountId,
        category: null,
      },
    });

    // Fast-path: auto-classify personal email domains without an LLM call
    const personal = uncategorized.filter((a) => PERSONAL_DOMAINS.has(a.domain.toLowerCase()));
    const needsLlm = uncategorized.filter((a) => !PERSONAL_DOMAINS.has(a.domain.toLowerCase()));

    if (personal.length > 0) {
      await prisma.discoveredAccount.updateMany({
        where: { id: { in: personal.map((a) => a.id) } },
        data: {
          category: "OTHER",
          categoryReason: "Personal email domain — auto-classified",
          categorizedAt: new Date(),
        },
      });
    }

    const autoSkipped = personal.length;
    let categorized = 0;

    for (let i = 0; i < needsLlm.length; i += DOMAINS_PER_CALL) {
      const batch = needsLlm.slice(i, i + DOMAINS_PER_CALL);

      const domainsWithEmails = await Promise.all(
        batch.map(async (account) => {
          const recentMessages = await prisma.emailMessage.findMany({
            where: {
              accountId: emailAccountId,
              addresses: {
                some: { type: "TO", address: { contains: `@${account.domain}` } },
              },
            },
            select: { subject: true },
            orderBy: { date: "desc" },
            take: 5,
          });

          const emailSummary = recentMessages
            .map((m) => `- ${m.subject || "(no subject)"}`)
            .join("\n");

          return {
            accountId: account.id,
            domain: account.domain,
            emailSummary,
          } satisfies DomainWithEmails;
        }),
      );

      const results = await this.categorizeBatch(domainsWithEmails);

      const now = new Date();

      for (const item of domainsWithEmails) {
        const result = results.find((r) => r.domain === item.domain);
        const category = result?.category ?? "OTHER";
        const reason = result?.reason ?? "Domain missing from batch response — defaulted to OTHER";

        await prisma.discoveredAccount.update({
          where: { id: item.accountId },
          data: { category, categoryReason: reason, categorizedAt: now },
        });

        categorized++;
      }
    }

    return { categorized, autoSkipped };
  }

  private static async categorizeBatch(
    domains: DomainWithEmails[],
  ): Promise<CategorizationResult[]> {
    const domainBlocks = domains
      .map(
        (d, i) =>
          `--- Domain ${i + 1}: ${d.domain} ---\n${d.emailSummary}`,
      )
      .join("\n\n");

    const prompt = `Classify each of the following ${domains.length} domains:\n\n${domainBlocks}\n\nRespond with a JSON array of ${domains.length} results.`;

    try {
      const response = await invokeClaudeOnBedrock({
        system: CATEGORIZATION_SYSTEM,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 256 * domains.length,
        model: CATEGORIZATION_MODEL,
      });

      return parseBatchResponse(response, domains.map((d) => d.domain));
    } catch (error) {
      console.error("Batch categorization failed, defaulting all to OTHER:", error);
      return domains.map((d) => ({
        domain: d.domain,
        category: "OTHER" as ProjectCategory,
        reason: "Batch categorization failed — defaulted to OTHER",
      }));
    }
  }
}

function parseBatchResponse(
  response: string,
  expectedDomains: string[],
): CategorizationResult[] {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return expectedDomains.map((domain) => ({
      domain,
      category: "OTHER",
      reason: "Could not parse LLM batch response",
    }));
  }

  try {
    const parsed: Array<{ domain?: string; category?: string; reason?: string }> =
      JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    const resultMap = new Map<string, CategorizationResult>();
    for (const item of parsed) {
      if (!item.domain) continue;
      const domain = item.domain.toLowerCase();
      const category = VALID_CATEGORIES.includes(item.category as ProjectCategory)
        ? (item.category as ProjectCategory)
        : "OTHER";
      resultMap.set(domain, {
        domain,
        category,
        reason: item.reason || "No reason provided",
      });
    }

    return expectedDomains.map((domain) =>
      resultMap.get(domain.toLowerCase()) ?? {
        domain,
        category: "OTHER",
        reason: "Domain missing from LLM batch response",
      },
    );
  } catch {
    return expectedDomains.map((domain) => ({
      domain,
      category: "OTHER",
      reason: "Could not parse LLM batch response",
    }));
  }
}
