import { EmailAccountNotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";
import { PipelineOrchestrator } from "@/features/pipeline/server";

import { EmailSyncService } from "./email-sync-service";
import { GmailApiService } from "./gmail-api-service";
import { GmailOAuthService } from "./gmail-oauth-service";

export class EmailService {
  static initiateOAuthConnection(userId: string) {
    const state = GmailOAuthService.encodeState({ userId });
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

    // Fire-and-forget: sync emails, start pipeline after first page of results
    // This runs in the background so the OAuth redirect isn't blocked
    EmailSyncService.fromAccountId(account.id)
      .then(async (syncService) => {
        await syncService.performInitialSync(() => {
          // Start pipeline after first page — don't wait for full sync
          console.log("[EmailSync] First page done, starting pipeline early");
          PipelineOrchestrator.runForAccount(account.id).catch((err) => {
            console.error("Early pipeline trigger failed:", err);
          });
        });
      })
      .catch((err) => {
        console.error("Background sync failed:", err);
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-service.ts:disconnectAccount',message:'about-to-delete',data:{accountId,syncStatus:account.syncStatus},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
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
