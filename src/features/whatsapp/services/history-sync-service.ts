import type { WAMessage, Chat, Contact } from "@whiskeysockets/baileys";
import prisma from "@/lib/prisma/client";

export class HistorySyncService {
  private messagesImported = 0;
  private messagesSkipped = 0;
  private cutoffMs: number;
  private contactNames = new Map<string, string>();

  constructor(syncDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - syncDays);
    this.cutoffMs = cutoff.getTime();
  }

  get progress() {
    return this.messagesImported;
  }

  private phoneFromJid(jid: string) {
    return jid.split("@")[0].split(":")[0];
  }

  getContactName(phone: string): string | null {
    return this.contactNames.get(phone) || null;
  }

  async processHistoryBatch(
    accountId: string,
    ownPhone: string,
    messages: WAMessage[],
    chats: Chat[],
    contacts?: Contact[],
  ): Promise<number> {
    let stored = 0;
    const chatNameMap = new Map(chats.map((c) => [c.id, c.name || null]));

    if (contacts) {
      for (const contact of contacts) {
        const displayName = contact.name || contact.notify || contact.verifiedName;
        if (!displayName) continue;

        const keys: string[] = [];
        if (contact.id) keys.push(this.phoneFromJid(contact.id));
        if (contact.phoneNumber) keys.push(contact.phoneNumber.replace(/\D/g, ""));

        for (const key of keys) {
          if (key && !this.contactNames.has(key)) {
            this.contactNames.set(key, displayName);
          }
        }
      }
      console.log(`[HistorySync] Contact name map now has ${this.contactNames.size} entries`);
    }

    for (const waMsg of messages) {
      try {
        const key = waMsg.key;
        if (!key?.remoteJid || !key.id) continue;

        const msgTimestamp = waMsg.messageTimestamp
          ? (typeof waMsg.messageTimestamp === "number" ? waMsg.messageTimestamp * 1000 : Number(waMsg.messageTimestamp) * 1000)
          : Date.now();

        if (msgTimestamp < this.cutoffMs) {
          this.messagesSkipped++;
          continue;
        }

        const chatJid = key.remoteJid;
        const isGroup = chatJid.endsWith("@g.us");
        const isFromMe = key.fromMe ?? false;

        let fromPhone: string;
        let toPhone: string;
        let direction: string;

        if (isGroup) {
          fromPhone = isFromMe ? ownPhone : this.phoneFromJid(key.participant || chatJid);
          toPhone = this.phoneFromJid(chatJid);
          direction = isFromMe ? "OUTBOUND" : "INBOUND";

          await prisma.whatsAppGroup.upsert({
            where: { accountId_jid: { accountId, jid: chatJid } },
            create: {
              accountId,
              jid: chatJid,
              name: chatNameMap.get(chatJid) || null,
            },
            update: {
              name: chatNameMap.get(chatJid) || undefined,
            },
          });
        } else {
          const contactPhone = this.phoneFromJid(chatJid);
          fromPhone = isFromMe ? ownPhone : contactPhone;
          toPhone = isFromMe ? contactPhone : ownPhone;
          direction = isFromMe ? "OUTBOUND" : "INBOUND";
        }

        const senderPhone = isFromMe ? ownPhone : fromPhone;
        const resolvedName = waMsg.pushName || this.contactNames.get(senderPhone) || null;

        const existing = await prisma.whatsAppMessage.findUnique({
          where: { externalId: key.id },
          select: { id: true },
        });
        if (existing) continue;

        const msg = waMsg.message;
        let messageType = "text";
        let textBody: string | null = null;
        let caption: string | null = null;

        if (msg) {
          if (msg.conversation) {
            textBody = msg.conversation;
          } else if (msg.extendedTextMessage?.text) {
            textBody = msg.extendedTextMessage.text;
          } else if (msg.imageMessage) {
            messageType = "image";
            caption = msg.imageMessage.caption || null;
          } else if (msg.videoMessage) {
            messageType = "video";
            caption = msg.videoMessage.caption || null;
          } else if (msg.audioMessage) {
            messageType = "audio";
          } else if (msg.documentMessage) {
            messageType = "document";
            caption = msg.documentMessage.fileName || null;
          } else if (msg.stickerMessage) {
            messageType = "sticker";
          } else if (msg.contactMessage) {
            messageType = "contacts";
          } else if (msg.locationMessage) {
            messageType = "location";
          }
        }

        const timestamp = waMsg.messageTimestamp
          ? new Date(
              typeof waMsg.messageTimestamp === "number"
                ? waMsg.messageTimestamp * 1000
                : Number(waMsg.messageTimestamp) * 1000,
            )
          : new Date();

        await prisma.whatsAppMessage.create({
          data: {
            accountId,
            externalId: key.id,
            fromPhone,
            toPhone,
            fromName: resolvedName,
            groupJid: isGroup ? chatJid : null,
            groupName: isGroup ? (chatNameMap.get(chatJid) || null) : null,
            direction,
            messageType,
            textBody,
            caption,
            source: "HISTORY_IMPORT",
            timestamp,
            status: "delivered",
          },
        });

        stored++;
        this.messagesImported++;
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002") continue;
        console.error("[HistorySync] Failed to store message:", error);
      }
    }

    return stored;
  }
}
