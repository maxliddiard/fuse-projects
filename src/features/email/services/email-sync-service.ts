import type { Prisma } from "@prisma/client";
import type { gmail_v1 } from "googleapis";

import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";

import { GmailApiService } from "./gmail-api-service";

export class EmailSyncService {
  private client: GmailApiService;
  private accountId: string;
  private aborted = false;

  constructor(client: GmailApiService, accountId: string) {
    this.client = client;
    this.accountId = accountId;
  }

  private isAccountGoneError(error: unknown): boolean {
    const code = (error as { code?: string }).code;
    return code === "P2025" || code === "P2003";
  }

  static async fromAccountId(accountId: string) {
    const client = await GmailApiService.fromAccountId(accountId);
    return new EmailSyncService(client, accountId);
  }

  async syncLabels() {
    const labels = await this.client.listLabels();

    for (const label of labels) {
      if (!label.id || !label.name) continue;

      const role = this.mapLabelToRole(label.name);

      await prisma.mailbox.upsert({
        where: {
          accountId_path: {
            accountId: this.accountId,
            path: label.id,
          },
        },
        create: {
          accountId: this.accountId,
          role,
          name: label.name,
          path: label.id,
          externalId: label.id,
        },
        update: {
          name: label.name,
          role,
        },
      });
    }
  }

  private mapLabelToRole(labelName: string): string {
    const mapping: Record<string, string> = {
      INBOX: "INBOX",
      SENT: "SENT",
      DRAFT: "DRAFTS",
      DRAFTS: "DRAFTS",
      TRASH: "TRASH",
      SPAM: "SPAM",
      STARRED: "STARRED",
      IMPORTANT: "IMPORTANT",
      ALL: "ALL_MAIL",
    };

    return mapping[labelName.toUpperCase()] || "CUSTOM";
  }

  async syncMessages(
    query?: string,
    maxResults = 500,
    onFirstPage?: () => void,
  ) {
    let totalSynced = 0;
    let totalFetched = 0;
    let pageToken: string | undefined;
    let page = 0;

    console.log("[EmailSync] Starting email sync...");

    // First, count total messages available so the frontend can show progress
    const initialResponse = await this.client.listMessages(query, 1);
    const estimatedTotal = initialResponse.resultSizeEstimate ?? 0;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:syncMessages:start',message:'sync-set-status-SYNCING',data:{accountId:this.accountId,estimatedTotal},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    await prisma.emailAccount.update({
      where: { id: this.accountId },
      data: {
        syncStatus: "SYNCING",
        syncedMessages: 0,
        totalMessages: estimatedTotal,
      },
    });

    do {
      page++;
      const response = await this.client.listMessages(
        query,
        maxResults,
        pageToken,
      );

      if (!response.messages) break;

      const messageIds = response.messages.map((m) => m.id!).filter(Boolean);
      console.log(
        `[EmailSync] Page ${page}: fetched ${messageIds.length} message IDs`,
      );

      // Fetch full message details in chunks of 25 to avoid Gmail rate limits
      const DETAIL_BATCH_SIZE = 25;
      for (let i = 0; i < messageIds.length; i += DETAIL_BATCH_SIZE) {
        const chunk = messageIds.slice(i, i + DETAIL_BATCH_SIZE);
        const messages = await this.client.getMessageBatch(chunk);

        for (const msgResponse of messages) {
          if (await this.saveMessage(msgResponse.data)) {
            totalSynced++;
          }
          if (this.aborted) break;
        }
        if (this.aborted) break;
      }

      if (this.aborted) break;

      totalFetched += messageIds.length;
      pageToken = response.nextPageToken ?? undefined;

      // Update progress in DB so frontend can poll.
      // Gmail's resultSizeEstimate is often wrong, so keep totalMessages >= syncedMessages.
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:syncMessages:progress',message:'sync-progress-update',data:{accountId:this.accountId,totalSynced,page},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
        await prisma.emailAccount.update({
          where: { id: this.accountId },
          data: {
            syncedMessages: totalSynced,
            totalMessages: Math.max(estimatedTotal, totalSynced),
          },
        });
      } catch (progressErr) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:syncMessages:progress-error',message:'sync-progress-update-failed',data:{accountId:this.accountId,error:progressErr instanceof Error ? progressErr.message : String(progressErr)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (this.isAccountGoneError(progressErr)) {
          this.aborted = true;
          break;
        }
        throw progressErr;
      }

      console.log(
        `[EmailSync] Progress: ${totalSynced} synced / ${totalFetched} fetched (est. ${estimatedTotal} total)`,
      );

      // After first page, fire callback so pipeline can start early
      if (page === 1) {
        onFirstPage?.();
      }
    } while (pageToken);

    console.log(
      `[EmailSync] Complete: ${totalSynced} synced, ${totalFetched} total fetched`,
    );
    return { synced: totalSynced, total: totalFetched };
  }

  private async saveMessage(gmailMessage: gmail_v1.Schema$Message) {
    if (!gmailMessage.id || !gmailMessage.payload) {
      return false;
    }

    const headers = this.client.parseMessageHeaders(
      gmailMessage.payload.headers || [],
    );
    const body = this.client.extractMessageBody(gmailMessage.payload);
    const attachments = this.client.extractAttachments(gmailMessage.payload);

    const date = headers.date ? new Date(headers.date) : new Date();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:saveMessage:start',message:'saving-message',data:{accountId:this.accountId,externalId:gmailMessage.id},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    await prisma.$transaction(async (tx) => {
      // Find or create conversation
      let conversation = null;
      if (gmailMessage.threadId) {
        conversation = await tx.emailConversation.upsert({
          where: {
            accountId_externalThread: {
              accountId: this.accountId,
              externalThread: gmailMessage.threadId,
            },
          },
          create: {
            accountId: this.accountId,
            externalThread: gmailMessage.threadId,
            subject: headers.subject || "",
          },
          update: {},
        });
      }

      // Create or update message
      const existingMessage = await tx.emailMessage.findFirst({
        where: {
          accountId: this.accountId,
          externalId: gmailMessage.id,
        },
      });

      const message = existingMessage
        ? await tx.emailMessage.update({
            where: { id: existingMessage.id },
            data: {
              snippet: gmailMessage.snippet,
              hasAttachments: attachments.length > 0,
            },
          })
        : await tx.emailMessage.create({
            data: {
              accountId: this.accountId,
              conversationId: conversation?.id,
              externalId: gmailMessage.id,
              rfc822MessageId: headers["message-id"],
              subject: headers.subject,
              snippet: gmailMessage.snippet,
              fromName: this.extractName(headers.from),
              fromAddress: this.extractEmail(headers.from),
              replyTo: headers["reply-to"],
              date,
              hasAttachments: attachments.length > 0,
            },
          });

      // Save message body
      if (body.text || body.html) {
        await tx.messageBody.upsert({
          where: { messageId: message.id },
          create: {
            messageId: message.id,
            text: body.text,
            html: body.html,
          },
          update: {
            text: body.text,
            html: body.html,
          },
        });
      }

      // Save addresses (inline — no EmailAddress join table)
      await this.saveAddresses(tx, message.id, headers);

      // Save mailbox associations
      if (gmailMessage.labelIds) {
        await this.saveMailboxAssociations(
          tx,
          message.id,
          gmailMessage.labelIds,
        );
      }

      // Save attachments (only for new messages)
      if (!existingMessage) {
        for (const attachment of attachments) {
          await tx.emailAttachment.create({
            data: {
              messageId: message.id,
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              size: attachment.size,
              providerPartId: attachment.attachmentId,
            },
          });
        }
      }
    }).catch((txErr) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:saveMessage:tx-error',message:'save-message-transaction-failed',data:{accountId:this.accountId,externalId:gmailMessage.id,error:txErr instanceof Error ? txErr.message : String(txErr)},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      if (this.isAccountGoneError(txErr)) {
        this.aborted = true;
        return;
      }
      throw txErr;
    });

    return !this.aborted;
  }

  private extractEmail(address?: string): string | undefined {
    if (!address) return undefined;
    const match = address.match(/<(.+?)>/) || address.match(/([^\s]+@[^\s]+)/);
    return match ? match[1] : address;
  }

  private extractName(address?: string): string | undefined {
    if (!address) return undefined;
    const match = address.match(/^(.+?)\s*</);
    return match ? match[1].replace(/"/g, "").trim() : undefined;
  }

  private async saveAddresses(
    tx: Prisma.TransactionClient,
    messageId: string,
    headers: Record<string, string>,
  ) {
    // Delete existing addresses for this message to avoid duplicates on re-sync
    await tx.messageAddress.deleteMany({ where: { messageId } });

    const addressTypes = ["from", "to", "cc", "bcc", "reply-to"];

    for (const type of addressTypes) {
      const headerValue = headers[type];
      if (!headerValue) continue;

      const addresses = this.parseAddressList(headerValue);

      for (const { email, name } of addresses) {
        await tx.messageAddress.create({
          data: {
            messageId,
            type: this.mapAddressType(type),
            address: email,
            name: name || null,
          },
        });
      }
    }
  }

  private parseAddressList(
    addressStr: string,
  ): Array<{ email: string; name?: string }> {
    const addresses: Array<{ email: string; name?: string }> = [];
    const parts = addressStr.split(",");

    for (const part of parts) {
      const email = this.extractEmail(part.trim());
      const name = this.extractName(part.trim());
      if (email) {
        addresses.push({ email, name });
      }
    }

    return addresses;
  }

  private mapAddressType(type: string): string {
    const mapping: Record<string, string> = {
      from: "FROM",
      to: "TO",
      cc: "CC",
      bcc: "BCC",
      "reply-to": "REPLY_TO",
    };
    return mapping[type.toLowerCase()] || "FROM";
  }

  private async saveMailboxAssociations(
    tx: Prisma.TransactionClient,
    messageId: string,
    labelIds: string[],
  ) {
    for (const labelId of labelIds) {
      const mailbox = await tx.mailbox.findFirst({
        where: {
          accountId: this.accountId,
          externalId: labelId,
        },
      });

      if (mailbox) {
        await tx.messageMailbox.upsert({
          where: {
            messageId_mailboxId: {
              messageId,
              mailboxId: mailbox.id,
            },
          },
          create: {
            messageId,
            mailboxId: mailbox.id,
            isSeen: !labelIds.includes("UNREAD"),
            isFlagged: labelIds.includes("STARRED"),
            isDraft: labelIds.includes("DRAFT"),
          },
          update: {
            isSeen: !labelIds.includes("UNREAD"),
            isFlagged: labelIds.includes("STARRED"),
          },
        });
      }
    }
  }

  async performInitialSync(onFirstPage?: () => void) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:performInitialSync:start',message:'initial-sync-started',data:{accountId:this.accountId},timestamp:Date.now(),hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      await this.syncLabels();
      const result = await this.syncMessages(undefined, 500, onFirstPage);

      if (this.aborted) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:performInitialSync:aborted',message:'sync-aborted-account-deleted',data:{accountId:this.accountId,synced:result.synced},timestamp:Date.now(),hypothesisId:'B,C'})}).catch(()=>{});
        // #endregion
        console.log(`[EmailSync] Aborted — account ${this.accountId} was deleted`);
        return result;
      }

      await prisma.emailAccount.update({
        where: { id: this.accountId },
        data: {
          syncStatus: "IDLE",
          lastSyncedAt: new Date(),
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:performInitialSync:done',message:'initial-sync-completed',data:{accountId:this.accountId,synced:result.synced},timestamp:Date.now(),hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:performInitialSync:catch',message:'initial-sync-error',data:{accountId:this.accountId,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      try {
        await prisma.emailAccount.update({
          where: { id: this.accountId },
          data: { syncStatus: "FAILED" },
        });
      } catch (updateErr) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-sync-service.ts:performInitialSync:catch-update-fail',message:'sync-failed-update-also-failed',data:{accountId:this.accountId,originalError:error instanceof Error ? error.message : String(error),updateError:updateErr instanceof Error ? updateErr.message : String(updateErr)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      throw error;
    }
  }
}
