import prisma from "@/lib/prisma/client";

interface DomainStats {
  domain: string;
  messageCount: bigint | number;
  firstSeen: bigint | string | null;
  lastSeen: bigint | string | null;
  addresses: string;
}

interface SentStats {
  domain: string;
  sentCount: bigint | number;
}

export class AccountDiscoveryService {
  static async discoverAccounts(emailAccountId: string): Promise<number> {
    // Get the user's own email domain to exclude it
    const account = await prisma.emailAccount.findUniqueOrThrow({
      where: { id: emailAccountId },
      select: { emailAddress: true },
    });
    const ownDomain = account.emailAddress.split("@")[1]?.toLowerCase();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.getTime(); // epoch ms to match SQLite storage

    // Get received message stats grouped by sender domain (last 6 months)
    const receivedStats = await prisma.$queryRawUnsafe<DomainStats[]>(
      `SELECT
        LOWER(SUBSTR(fromAddress, INSTR(fromAddress, '@') + 1)) as domain,
        COUNT(*) as messageCount,
        MIN(date) as firstSeen,
        MAX(date) as lastSeen,
        GROUP_CONCAT(DISTINCT LOWER(fromAddress)) as addresses
      FROM EmailMessage
      WHERE accountId = ?
        AND fromAddress IS NOT NULL
        AND INSTR(fromAddress, '@') > 0
        AND date >= ?
      GROUP BY LOWER(SUBSTR(fromAddress, INSTR(fromAddress, '@') + 1))
      HAVING COUNT(*) >= 2`,
      emailAccountId,
      cutoff,
    );

    // Get sent message stats grouped by recipient domain (last 6 months)
    const sentStats = await prisma.$queryRawUnsafe<SentStats[]>(
      `SELECT
        LOWER(SUBSTR(ma.address, INSTR(ma.address, '@') + 1)) as domain,
        COUNT(DISTINCT em.id) as sentCount
      FROM MessageAddress ma
      JOIN EmailMessage em ON em.id = ma.messageId
      WHERE em.accountId = ?
        AND ma.type = 'TO'
        AND INSTR(ma.address, '@') > 0
        AND em.date >= ?
      GROUP BY LOWER(SUBSTR(ma.address, INSTR(ma.address, '@') + 1))`,
      emailAccountId,
      cutoff,
    );

    const sentMap = new Map(sentStats.map((s) => [s.domain, Number(s.sentCount)]));

    // Filter out own domain and upsert discovered accounts
    const domains = receivedStats.filter(
      (r) => r.domain && r.domain !== ownDomain,
    );

    for (const stats of domains) {
      const sentCount = sentMap.get(stats.domain) || 0;
      const receivedCount = Number(stats.messageCount);
      const addresses = stats.addresses
        ? JSON.stringify(stats.addresses.split(","))
        : "[]";

      // Convert epoch ms (BigInt from SQLite) to Date objects
      const firstSeenAt = stats.firstSeen ? new Date(Number(stats.firstSeen)) : null;
      const lastSeenAt = stats.lastSeen ? new Date(Number(stats.lastSeen)) : null;

      // Pick a display name from the first address's fromName
      const sampleMessage = await prisma.emailMessage.findFirst({
        where: {
          accountId: emailAccountId,
          fromAddress: { contains: `@${stats.domain}` },
          fromName: { not: null },
        },
        select: { fromName: true },
        orderBy: { date: "desc" },
      });

      await prisma.discoveredAccount.upsert({
        where: {
          emailAccountId_domain: {
            emailAccountId,
            domain: stats.domain,
          },
        },
        create: {
          emailAccountId,
          domain: stats.domain,
          displayName: sampleMessage?.fromName || null,
          emailAddresses: addresses,
          messageCount: receivedCount + sentCount,
          receivedCount,
          sentCount,
          isBidirectional: sentCount > 0,
          firstSeenAt,
          lastSeenAt,
        },
        update: {
          displayName: sampleMessage?.fromName || undefined,
          emailAddresses: addresses,
          messageCount: receivedCount + sentCount,
          receivedCount,
          sentCount,
          isBidirectional: sentCount > 0,
          firstSeenAt,
          lastSeenAt,
        },
      });
    }

    return domains.length;
  }
}
