import { invokeClaudeOnBedrock, type BedrockModel } from "@/lib/bedrock/client";
import prisma from "@/lib/prisma/client";

import {
  VALID_CATEGORIES,
  type ProjectCategory,
} from "@/features/projects/config/categories";

import {
  DEFAULT_EMAIL_CATEGORIZATION_PROMPT,
  DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT,
  EMAIL_CATEGORIZATION_FORMAT_SUFFIX,
  WHATSAPP_CATEGORIZATION_FORMAT_SUFFIX,
} from "../constants";

const DOMAINS_PER_CALL = 30;
const CATEGORIZATION_MODEL: BedrockModel = "haiku";

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
  "icloud.com", "aol.com", "protonmail.com", "live.com",
  "me.com", "msn.com", "mail.com",
]);

interface CategorizationResult {
  identifier: string;
  category: ProjectCategory;
  reason: string;
}

interface DomainWithEmails {
  accountId: string;
  domain: string;
  emailSummary: string;
}

interface ContactWithMessages {
  accountId: string;
  phoneNumber: string;
  contactName: string | null;
  messageSummary: string;
}

export class AccountCategorizationService {
  static async categorizeAccounts(
    emailAccountId: string,
  ): Promise<{ categorized: number; autoSkipped: number }> {
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      select: { categorizationPrompt: true },
    });

    const systemPrompt =
      (emailAccount?.categorizationPrompt || DEFAULT_EMAIL_CATEGORIZATION_PROMPT) +
      EMAIL_CATEGORIZATION_FORMAT_SUFFIX;

    const uncategorized = await prisma.discoveredAccount.findMany({
      where: {
        emailAccountId,
        category: null,
      },
    });

    // Fast-path: auto-classify personal email domains without an LLM call
    const personal = uncategorized.filter((a) => a.domain && PERSONAL_DOMAINS.has(a.domain.toLowerCase()));
    const needsLlm = uncategorized.filter((a) => a.domain && !PERSONAL_DOMAINS.has(a.domain.toLowerCase()));

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
          const domain = account.domain!;
          const recentMessages = await prisma.emailMessage.findMany({
            where: {
              accountId: emailAccountId,
              addresses: {
                some: { type: "TO", address: { contains: `@${domain}` } },
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
            domain,
            emailSummary,
          } satisfies DomainWithEmails;
        }),
      );

      const results = await this.categorizeBatch(domainsWithEmails, systemPrompt);

      const now = new Date();

      for (const item of domainsWithEmails) {
        const result = results.find((r) => r.identifier === item.domain);
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

  static async categorizeWhatsAppAccounts(
    whatsAppAccountId: string,
  ): Promise<{ categorized: number; autoSkipped: number }> {
    const waAccount = await prisma.whatsAppAccount.findUnique({
      where: { id: whatsAppAccountId },
      select: { categorizationPrompt: true },
    });

    const systemPrompt =
      (waAccount?.categorizationPrompt || DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT) +
      WHATSAPP_CATEGORIZATION_FORMAT_SUFFIX;

    const uncategorized = await prisma.discoveredAccount.findMany({
      where: {
        whatsAppAccountId,
        category: null,
      },
    });

    if (uncategorized.length === 0) {
      return { categorized: 0, autoSkipped: 0 };
    }

    let categorized = 0;

    for (let i = 0; i < uncategorized.length; i += DOMAINS_PER_CALL) {
      const batch = uncategorized.slice(i, i + DOMAINS_PER_CALL);

      const contactsWithMessages = await Promise.all(
        batch.map(async (account) => {
          const isGroup = !!account.groupJid;
          const identifier = isGroup ? account.groupJid! : account.phoneNumber!;

          const whereClause = isGroup
            ? { accountId: whatsAppAccountId, groupJid: account.groupJid! }
            : {
                accountId: whatsAppAccountId,
                groupJid: null,
                OR: [
                  { fromPhone: account.phoneNumber! },
                  { toPhone: account.phoneNumber! },
                ],
              };

          const recentMessages = await prisma.whatsAppMessage.findMany({
            where: whereClause,
            select: { textBody: true, direction: true, fromName: true },
            orderBy: { timestamp: "desc" },
            take: 5,
          });

          const messageSummary = recentMessages
            .map((m) => `- [${m.fromName || m.direction}] ${m.textBody || "(media message)"}`)
            .join("\n");

          return {
            accountId: account.id,
            phoneNumber: identifier,
            contactName: account.displayName,
            messageSummary,
          } satisfies ContactWithMessages;
        }),
      );

      const results = await this.categorizeWhatsAppBatch(contactsWithMessages, systemPrompt);

      const now = new Date();

      for (const item of contactsWithMessages) {
        const result = results.find((r) => r.identifier === item.phoneNumber);
        const category = result?.category ?? "OTHER";
        const reason = result?.reason ?? "Contact missing from batch response — defaulted to OTHER";

        await prisma.discoveredAccount.update({
          where: { id: item.accountId },
          data: { category, categoryReason: reason, categorizedAt: now },
        });

        categorized++;
      }
    }

    return { categorized, autoSkipped: 0 };
  }

  private static async categorizeBatch(
    domains: DomainWithEmails[],
    systemPrompt: string,
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
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 256 * domains.length,
        model: CATEGORIZATION_MODEL,
      });

      return parseBatchResponse(response, domains.map((d) => d.domain));
    } catch (error) {
      console.error("Batch categorization failed, defaulting all to OTHER:", error);
      return domains.map((d) => ({
        identifier: d.domain,
        category: "OTHER" as ProjectCategory,
        reason: "Batch categorization failed — defaulted to OTHER",
      }));
    }
  }

  private static async categorizeWhatsAppBatch(
    contacts: ContactWithMessages[],
    systemPrompt: string,
  ): Promise<CategorizationResult[]> {
    const contactBlocks = contacts
      .map(
        (c, i) =>
          `--- Contact ${i + 1}: ${c.phoneNumber} (${c.contactName || "unknown"}) ---\n${c.messageSummary}`,
      )
      .join("\n\n");

    const prompt = `Classify each of the following ${contacts.length} WhatsApp contacts:\n\n${contactBlocks}\n\nRespond with a JSON array of ${contacts.length} results.`;

    try {
      const response = await invokeClaudeOnBedrock({
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 256 * contacts.length,
        model: CATEGORIZATION_MODEL,
      });

      return parseBatchResponse(response, contacts.map((c) => c.phoneNumber));
    } catch (error) {
      console.error("WhatsApp batch categorization failed, defaulting all to OTHER:", error);
      return contacts.map((c) => ({
        identifier: c.phoneNumber,
        category: "OTHER" as ProjectCategory,
        reason: "Batch categorization failed — defaulted to OTHER",
      }));
    }
  }
}

function parseBatchResponse(
  response: string,
  expectedIdentifiers: string[],
): CategorizationResult[] {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return expectedIdentifiers.map((identifier) => ({
      identifier,
      category: "OTHER",
      reason: "Could not parse LLM batch response",
    }));
  }

  try {
    const parsed: Array<{ domain?: string; identifier?: string; category?: string; reason?: string }> =
      JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    const resultMap = new Map<string, CategorizationResult>();
    for (const item of parsed) {
      const key = (item.identifier || item.domain || "").toLowerCase();
      if (!key) continue;
      const category = VALID_CATEGORIES.includes(item.category as ProjectCategory)
        ? (item.category as ProjectCategory)
        : "OTHER";
      resultMap.set(key, {
        identifier: key,
        category,
        reason: item.reason || "No reason provided",
      });
    }

    return expectedIdentifiers.map((id) =>
      resultMap.get(id.toLowerCase()) ?? {
        identifier: id,
        category: "OTHER",
        reason: "Identifier missing from LLM batch response",
      },
    );
  } catch {
    return expectedIdentifiers.map((identifier) => ({
      identifier,
      category: "OTHER",
      reason: "Could not parse LLM batch response",
    }));
  }
}
