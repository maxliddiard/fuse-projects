import { EmailAccountNotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";
import { PipelineOrchestrator } from "@/features/pipeline/server";

import { EmailSyncService } from "./email-sync-service";
import { GmailApiService } from "./gmail-api-service";
import { GmailOAuthService } from "./gmail-oauth-service";

export class EmailService {
  static initiateOAuthConnection(userId: string, returnTo: string = "/") {
    const state = GmailOAuthService.encodeState({ userId, returnTo });
    const authUrl = GmailOAuthService.getAuthUrl(state);
    return { authUrl };
  }

  static async completeOAuthCallback(code: string, state: string) {
    const { userId } = GmailOAuthService.decodeState(state);
    const tokens = await GmailOAuthService.exchangeCode(code);
    const userInfo = await GmailOAuthService.getUserInfo(tokens.accessToken);

    const account = await EmailAccountRepository.upsertFromOAuth({
      userId,
      emailAddress: userInfo.email,
      displayName: userInfo.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined,
      vendorAccountId: userInfo.id,
    });

    // Phase 1: Quick metadata scan → pipeline (discovery + categorization)
    // Phase 2: Targeted full sync for SALES domains → exploration
    EmailSyncService.fromAccountId(account.id)
      .then(async (syncService) => {
        await syncService.performQuickScan();

        const runId = await PipelineOrchestrator.runForAccount(account.id);
        console.log(`[Pipeline] Completed analysis run ${runId}`);

        // Phase 2: full sync + exploration for SALES domains only
        await syncService.syncSalesDomains(account.id);
        await PipelineOrchestrator.runExploration(account.id);

        // Phase 3: background full sync to populate the Emails page (2 pages = ~1000 messages)
        await syncService.performInitialSync(2);
      })
      .catch((err) => {
        console.error("Background scan/pipeline failed:", err);
      });

    return account;
  }

  static async listAccounts(userId: string) {
    return EmailAccountRepository.findByUserId(userId);
  }

  static async disconnectAccount(accountId: string, userId: string) {
    const account = await EmailAccountRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new EmailAccountNotFoundError(accountId);
    }

    await EmailAccountRepository.delete(accountId);
  }

  static async syncAccount(accountId: string, userId: string) {
    const account = await EmailAccountRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new EmailAccountNotFoundError(accountId);
    }

    const syncService = await EmailSyncService.fromAccountId(accountId);
    return syncService.performInitialSync();
  }

  static async sendEmail(params: {
    accountId: string;
    userId: string;
    to: string;
    subject?: string;
    message: string;
    isHtml?: boolean;
    cc?: string;
    bcc?: string;
    inReplyTo?: string;
  }) {
    const account = await EmailAccountRepository.findByIdAndUser(
      params.accountId,
      params.userId,
    );
    if (!account) {
      throw new EmailAccountNotFoundError(params.accountId);
    }

    // If replying, look up the original message's rfc822MessageId for threading
    let rfc822InReplyTo: string | undefined;
    let threadId: string | undefined;
    if (params.inReplyTo) {
      const originalMessage = await prisma.emailMessage.findFirst({
        where: { id: params.inReplyTo },
        select: {
          rfc822MessageId: true,
          conversation: { select: { externalThread: true } },
        },
      });
      if (originalMessage) {
        rfc822InReplyTo = originalMessage.rfc822MessageId ?? undefined;
        threadId = originalMessage.conversation?.externalThread ?? undefined;
      }
    }

    const gmailClient = await GmailApiService.fromAccountId(params.accountId);
    return gmailClient.sendMessage(
      params.to,
      params.subject || "",
      params.message,
      params.isHtml,
      params.cc,
      params.bcc,
      rfc822InReplyTo,
      threadId,
    );
  }
}
