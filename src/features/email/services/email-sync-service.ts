import type { gmail_v1 } from "googleapis";

import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";

import { GmailApiService } from "./gmail-api-service";

export class EmailSyncService {
  private client: GmailApiService;
  private accountId: string;

  constructor(client: GmailApiService, accountId: string) {
    this.client = client;
    this.accountId = accountId;
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

  async syncMessages(query?: string, maxResults = 100) {
    const response = await this.client.listMessages(query, maxResults);

    if (!response.messages) {
      return { synced: 0, total: 0 };
    }

    const messageIds = response.messages.map((m) => m.id!).filter(Boolean);
    const messages = await this.client.getMessageBatch(messageIds);

    let synced = 0;
    for (const msgResponse of messages) {
      const message = msgResponse.data;
      if (await this.saveMessage(message)) {
        synced++;
      }
    }

    return { synced, total: messages.length };
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
    });

    return true;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async saveAddresses(
    tx: any,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async saveMailboxAssociations(
    tx: any,
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

  async performInitialSync() {
    await this.syncLabels();
    const result = await this.syncMessages(undefined, 100);
    await EmailAccountRepository.updateLastSyncedAt(this.accountId);
    return result;
  }
}
