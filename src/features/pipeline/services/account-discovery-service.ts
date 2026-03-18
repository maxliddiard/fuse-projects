import prisma from "@/lib/prisma/client";

interface DomainStats {
  domain: string;
  messageCount: bigint | number;
  firstSeen: bigint | string | null;
  lastSeen: bigint | string | null;
  addresses: string;
}

export class AccountDiscoveryService {
  static async discoverAccounts(emailAccountId: string): Promise<number> {
    const account = await prisma.emailAccount.findUniqueOrThrow({
      where: { id: emailAccountId },
      select: { emailAddress: true },
    });
    const ownDomain = account.emailAddress.split("@")[1]?.toLowerCase();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoff = ninetyDaysAgo.getTime();

    // Discover domains from TO addresses on sent messages.
    // Every domain found here is bidirectional by construction —
    // if we sent to them, there's two-way communication.
    const sentToStats = await prisma.$queryRawUnsafe<DomainStats[]>(
      `SELECT
        LOWER(SUBSTR(ma.address, INSTR(ma.address, '@') + 1)) as domain,
        COUNT(DISTINCT em.id) as messageCount,
        MIN(em.date) as firstSeen,
        MAX(em.date) as lastSeen,
        GROUP_CONCAT(DISTINCT LOWER(ma.address)) as addresses
      FROM MessageAddress ma
      JOIN EmailMessage em ON em.id = ma.messageId
      WHERE em.accountId = ?
        AND ma.type = 'TO'
        AND INSTR(ma.address, '@') > 0
        AND em.date >= ?
      GROUP BY LOWER(SUBSTR(ma.address, INSTR(ma.address, '@') + 1))
      HAVING COUNT(DISTINCT em.id) >= 2`,
      emailAccountId,
      cutoff,
    );

    const domains = sentToStats.filter(
      (r) => r.domain && r.domain !== ownDomain,
    );

    for (const stats of domains) {
      const sentCount = Number(stats.messageCount);
      const addresses = stats.addresses
        ? JSON.stringify(stats.addresses.split(","))
        : "[]";

      const firstSeenAt = stats.firstSeen ? new Date(Number(stats.firstSeen)) : null;
      const lastSeenAt = stats.lastSeen ? new Date(Number(stats.lastSeen)) : null;

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
          displayName: stats.domain,
          emailAddresses: addresses,
          messageCount: sentCount,
          receivedCount: 0,
          sentCount,
          isBidirectional: true,
          firstSeenAt,
          lastSeenAt,
        },
        update: {
          emailAddresses: addresses,
          messageCount: sentCount,
          sentCount,
          isBidirectional: true,
          firstSeenAt,
          lastSeenAt,
        },
      });
    }

    return domains.length;
  }
}
