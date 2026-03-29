import { ResourceNotFoundError } from "@/lib/errors";
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
  }) {
    const accessToken = await WhatsAppOAuthService.exchangeCodeForToken(
      params.code,
    );

    const account = await WhatsAppAccountRepository.upsertFromEmbeddedSignup({
      userId: params.userId,
      phoneNumber: params.phoneNumber,
      displayName: params.displayName,
      waBusinessAccountId: params.waBusinessAccountId,
      phoneNumberId: params.phoneNumberId,
      accessToken,
    });

    PipelineOrchestrator.runForWhatsAppAccount(account.id).catch((err) => {
      console.error("WhatsApp background pipeline failed:", err);
    });

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
