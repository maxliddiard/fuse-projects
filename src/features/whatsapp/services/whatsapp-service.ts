import { ResourceNotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma/client";
import { WhatsAppAccountRepository } from "@/lib/repositories/whatsapp-account-repository";
import { PipelineOrchestrator } from "@/features/pipeline/server";

import { WhatsAppApiService } from "./whatsapp-api-service";
import { WhatsAppOAuthService } from "./whatsapp-oauth-service";
import { WhatsAppSyncService } from "./whatsapp-sync-service";

export class WhatsAppService {
  static getEmbeddedSignupConfig(userId: string) {
    const config = WhatsAppOAuthService.getEmbeddedSignupConfig();
    const state = WhatsAppOAuthService.encodeState({
      userId,
      returnTo: "/settings/email",
    });
    return { ...config, state };
  }

  static async completeEmbeddedSignup(params: {
    code: string;
    userId: string;
    phoneNumber: string;
    phoneNumberId: string;
    waBusinessAccountId: string;
    displayName?: string;
    categorizationPrompt?: string;
  }) {
    const accessToken = await WhatsAppOAuthService.exchangeCodeForToken(
      params.code,
    );

    // Check if account already exists from history import (step 1)
    const existing = params.phoneNumber
      ? await prisma.whatsAppAccount.findUnique({
          where: {
            userId_phoneNumber: {
              userId: params.userId,
              phoneNumber: params.phoneNumber,
            },
          },
        })
      : null;

    let account;
    if (existing) {
      account = await prisma.whatsAppAccount.update({
        where: { id: existing.id },
        data: {
          waBusinessAccountId: params.waBusinessAccountId || undefined,
          phoneNumberId: params.phoneNumberId || undefined,
          accessToken,
          displayName: params.displayName || undefined,
          categorizationPrompt: params.categorizationPrompt || undefined,
          status: "ACTIVE",
        },
      });
    } else {
      account = await WhatsAppAccountRepository.upsertFromEmbeddedSignup({
        userId: params.userId,
        phoneNumber: params.phoneNumber,
        displayName: params.displayName,
        waBusinessAccountId: params.waBusinessAccountId,
        phoneNumberId: params.phoneNumberId,
        accessToken,
        categorizationPrompt: params.categorizationPrompt,
      });
    }

    // Only auto-run pipeline if history import hasn't already run it
    const hasHistorySync = existing?.historySyncStatus === "COMPLETED";
    if (!hasHistorySync) {
      PipelineOrchestrator.runForWhatsAppAccount(account.id).catch((err) => {
        console.error("WhatsApp background pipeline failed:", err);
      });
    }

    return account;
  }

  static async listAccounts(userId: string) {
    return WhatsAppAccountRepository.findByUserId(userId);
  }

  static async disconnectAccount(accountId: string, userId: string) {
    const account = await WhatsAppAccountRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new ResourceNotFoundError("WhatsAppAccount", accountId);
    }

    await WhatsAppAccountRepository.delete(accountId);
  }

  static async sendMessage(params: {
    accountId: string;
    userId: string;
    to: string;
    message: string;
  }) {
    const account = await WhatsAppAccountRepository.findByIdAndUser(
      params.accountId,
      params.userId,
    );
    if (!account) {
      throw new ResourceNotFoundError("WhatsAppAccount", params.accountId);
    }

    const client = await WhatsAppApiService.fromAccountId(params.accountId);
    const result = await client.sendTextMessage(params.to, params.message);

    const waMessageId = result.messages?.[0]?.id;
    if (waMessageId) {
      await WhatsAppSyncService.storeOutboundMessage({
        accountId: params.accountId,
        externalId: waMessageId,
        toPhone: params.to,
        textBody: params.message,
        phoneNumber: account.phoneNumber,
      });
    }

    return result;
  }
}
