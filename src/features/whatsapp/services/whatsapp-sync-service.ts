import prisma from "@/lib/prisma/client";
import { WhatsAppAccountRepository } from "@/lib/repositories/whatsapp-account-repository";

import type { ParsedWebhookPayload } from "./whatsapp-webhook-service";

export class WhatsAppSyncService {
  static async processInboundMessages(
    payload: ParsedWebhookPayload,
  ): Promise<number> {
    const account = await WhatsAppAccountRepository.findByPhoneNumberId(
      payload.phoneNumberId,
    );
    if (!account) {
      console.warn(
        `[WhatsApp] No account found for phone_number_id: ${payload.phoneNumberId}`,
      );
      return 0;
    }

    let stored = 0;

    for (const msg of payload.messages) {
      const existing = await prisma.whatsAppMessage.findUnique({
        where: { externalId: msg.externalId },
      });

      if (existing) continue;

      await prisma.whatsAppMessage.create({
        data: {
          accountId: account.id,
          externalId: msg.externalId,
          fromPhone: msg.fromPhone,
          toPhone: account.phoneNumber,
          fromName: msg.fromName,
          groupJid: null,
          groupName: null,
          direction: "INBOUND",
          messageType: msg.messageType,
          textBody: msg.textBody,
          caption: msg.caption,
          source: "WEBHOOK",
          timestamp: msg.timestamp,
          status: "delivered",
        },
      });

      stored++;
    }

    if (stored > 0) {
      await WhatsAppAccountRepository.updateLastSyncedAt(account.id);
    }

    return stored;
  }

  static async processStatusUpdates(
    payload: ParsedWebhookPayload,
  ): Promise<number> {
    let updated = 0;

    for (const status of payload.statuses) {
      const message = await prisma.whatsAppMessage.findUnique({
        where: { externalId: status.id },
      });

      if (!message) continue;

      await prisma.whatsAppMessage.update({
        where: { id: message.id },
        data: { status: status.status },
      });

      updated++;
    }

    return updated;
  }

  static async storeOutboundMessage(params: {
    accountId: string;
    externalId: string;
    toPhone: string;
    textBody: string;
    phoneNumber: string;
  }): Promise<void> {
    await prisma.whatsAppMessage.create({
      data: {
        accountId: params.accountId,
        externalId: params.externalId,
        fromPhone: params.phoneNumber,
        toPhone: params.toPhone,
        direction: "OUTBOUND",
        messageType: "text",
        textBody: params.textBody,
        source: "WEBHOOK",
        timestamp: new Date(),
        status: "sent",
      },
    });
  }
}
