import prisma from "../prisma/client";

export class EmailAccountRepository {
  static async findByUserId(userId: string) {
    return prisma.emailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByIdAndUser(accountId: string, userId: string) {
    return prisma.emailAccount.findFirst({
      where: { id: accountId, userId },
    });
  }

  static async upsertFromOAuth(params: {
    userId: string;
    emailAddress: string;
    displayName?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    vendorAccountId?: string;
  }): Promise<{ account: Awaited<ReturnType<typeof prisma.emailAccount.upsert>>; isNew: boolean }> {
    const existing = await prisma.emailAccount.findUnique({
      where: {
        userId_emailAddress: {
          userId: params.userId,
          emailAddress: params.emailAddress,
        },
      },
      select: { id: true },
    });

    const account = await prisma.emailAccount.upsert({
      where: {
        userId_emailAddress: {
          userId: params.userId,
          emailAddress: params.emailAddress,
        },
      },
      create: {
        userId: params.userId,
        emailAddress: params.emailAddress,
        displayName: params.displayName,
        status: "ACTIVE",
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        tokenExpiresAt: params.tokenExpiresAt,
        vendorAccountId: params.vendorAccountId,
      },
      update: {
        displayName: params.displayName,
        status: "ACTIVE",
        accessToken: params.accessToken,
        refreshToken: params.refreshToken ?? undefined,
        tokenExpiresAt: params.tokenExpiresAt,
        vendorAccountId: params.vendorAccountId,
      },
    });

    return { account, isNew: !existing };
  }

  static async getCredentials(accountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
      select: {
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true,
      },
    });

    if (!account) return null;

    return {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      tokenExpiresAt: account.tokenExpiresAt,
    };
  }

  static async updateTokens(
    accountId: string,
    tokens: { accessToken: string; tokenExpiresAt?: Date },
  ) {
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        accessToken: tokens.accessToken,
        tokenExpiresAt: tokens.tokenExpiresAt ?? null,
      },
    });
  }

  static async delete(accountId: string) {
    await prisma.emailAccount.delete({
      where: { id: accountId },
    });
  }

  static async updateLastSyncedAt(accountId: string) {
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date() },
    });
  }
}
