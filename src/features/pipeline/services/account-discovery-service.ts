import prisma from "@/lib/prisma/client";

interface DomainStats {
  domain: string;
  messageCount: bigint | number;
  firstSeen: bigint | string | null;
  lastSeen: bigint | string | null;
  addresses: string;
}

interface PhoneStats {
  phone: string;
  contactName: string | null;
  messageCount: bigint | number;
  sentCount: bigint | number;
  receivedCount: bigint | number;
  firstSeen: string | null;
  lastSeen: string | null;
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
          sourceType: "EMAIL",
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

  static async discoverWhatsAppAccounts(whatsAppAccountId: string): Promise<number> {
    const account = await prisma.whatsAppAccount.findUniqueOrThrow({
      where: { id: whatsAppAccountId },
      select: { phoneNumber: true },
    });
    const ownPhone = account.phoneNumber;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Discover 1:1 contacts (exclude group messages)
    const phoneStats = await prisma.$queryRawUnsafe<PhoneStats[]>(
      `SELECT
        CASE WHEN direction = 'INBOUND' THEN fromPhone ELSE toPhone END as phone,
        MAX(fromName) as contactName,
        COUNT(*) as messageCount,
        SUM(CASE WHEN direction = 'OUTBOUND' THEN 1 ELSE 0 END) as sentCount,
        SUM(CASE WHEN direction = 'INBOUND' THEN 1 ELSE 0 END) as receivedCount,
        MIN(timestamp) as firstSeen,
        MAX(timestamp) as lastSeen
      FROM WhatsAppMessage
      WHERE accountId = ?
        AND timestamp >= ?
        AND groupJid IS NULL
      GROUP BY CASE WHEN direction = 'INBOUND' THEN fromPhone ELSE toPhone END
      HAVING COUNT(*) >= 2`,
      whatsAppAccountId,
      ninetyDaysAgo.getTime(),
    );

    const contacts = phoneStats.filter(
      (r) => r.phone && r.phone !== ownPhone,
    );

    for (const stats of contacts) {
      const messageCount = Number(stats.messageCount);
      const sentCount = Number(stats.sentCount);
      const receivedCount = Number(stats.receivedCount);
      const isBidirectional = sentCount > 0 && receivedCount > 0;

      const firstSeenAt = stats.firstSeen ? new Date(Number(stats.firstSeen)) : null;
      const lastSeenAt = stats.lastSeen ? new Date(Number(stats.lastSeen)) : null;

      await prisma.discoveredAccount.upsert({
        where: {
          whatsAppAccountId_phoneNumber: {
            whatsAppAccountId,
            phoneNumber: stats.phone,
          },
        },
        create: {
          whatsAppAccountId,
          sourceType: "WHATSAPP",
          phoneNumber: stats.phone,
          displayName: stats.contactName || stats.phone,
          messageCount,
          sentCount,
          receivedCount,
          isBidirectional,
          firstSeenAt,
          lastSeenAt,
        },
        update: {
          displayName: stats.contactName || stats.phone,
          messageCount,
          sentCount,
          receivedCount,
          isBidirectional,
          firstSeenAt,
          lastSeenAt,
        },
      });
    }

    // Discover groups from WhatsAppGroup table
    const groups = await prisma.whatsAppGroup.findMany({
      where: { accountId: whatsAppAccountId },
    });

    for (const group of groups) {
      const groupMessageStats = await prisma.whatsAppMessage.aggregate({
        where: {
          accountId: whatsAppAccountId,
          groupJid: group.jid,
          timestamp: { gte: ninetyDaysAgo },
        },
        _count: true,
        _min: { timestamp: true },
        _max: { timestamp: true },
      });

      if (groupMessageStats._count < 2) continue;

      await prisma.discoveredAccount.upsert({
        where: {
          whatsAppAccountId_groupJid: {
            whatsAppAccountId,
            groupJid: group.jid,
          },
        },
        create: {
          whatsAppAccountId,
          sourceType: "WHATSAPP",
          groupJid: group.jid,
          displayName: group.name || group.jid,
          messageCount: groupMessageStats._count,
          sentCount: 0,
          receivedCount: 0,
          isBidirectional: true,
          firstSeenAt: groupMessageStats._min.timestamp,
          lastSeenAt: groupMessageStats._max.timestamp,
        },
        update: {
          displayName: group.name || group.jid,
          messageCount: groupMessageStats._count,
          firstSeenAt: groupMessageStats._min.timestamp,
          lastSeenAt: groupMessageStats._max.timestamp,
        },
      });
    }

    return contacts.length + groups.length;
  }
}
