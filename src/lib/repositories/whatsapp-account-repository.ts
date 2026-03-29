import prisma from "../prisma/client";

export class WhatsAppAccountRepository {
  static async findByUserId(userId: string) {
    return prisma.whatsAppAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByIdAndUser(accountId: string, userId: string) {
    return prisma.whatsAppAccount.findFirst({
      where: { id: accountId, userId },
    });
  }

  static async upsertFromEmbeddedSignup(params: {
    userId: string;
    phoneNumber: string;
    displayName?: string;
    waBusinessAccountId?: string;
    phoneNumberId?: string;
    accessToken?: string;
    categorizationPrompt?: string;
  }) {
    return prisma.whatsAppAccount.upsert({
      where: {
        userId_phoneNumber: {
          userId: params.userId,
          phoneNumber: params.phoneNumber,
        },
      },
      create: {
        userId: params.userId,
        phoneNumber: params.phoneNumber,
        displayName: params.displayName,
        waBusinessAccountId: params.waBusinessAccountId,
        phoneNumberId: params.phoneNumberId,
        accessToken: params.accessToken,
        categorizationPrompt: params.categorizationPrompt,
        status: "ACTIVE",
      },
      update: {
        displayName: params.displayName,
        waBusinessAccountId: params.waBusinessAccountId ?? undefined,
        phoneNumberId: params.phoneNumberId ?? undefined,
        accessToken: params.accessToken ?? undefined,
        status: "ACTIVE",
      },
    });
  }

  static async getCredentials(accountId: string) {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      select: {
        accessToken: true,
        phoneNumberId: true,
        waBusinessAccountId: true,
      },
    });

    if (!account || !account.accessToken || !account.phoneNumberId) return null;

    return {
      accessToken: account.accessToken,
      phoneNumberId: account.phoneNumberId,
      waBusinessAccountId: account.waBusinessAccountId || "",
    };
  }

  static async findByPhoneNumberId(phoneNumberId: string) {
    return prisma.whatsAppAccount.findFirst({
      where: { phoneNumberId },
    });
  }

  static async updateAccessToken(accountId: string, accessToken: string) {
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { accessToken },
    });
  }

  static async delete(accountId: string) {
    await prisma.whatsAppAccount.delete({
      where: { id: accountId },
    });
  }

  static async updateLastSyncedAt(accountId: string) {
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date() },
    });
  }
}
