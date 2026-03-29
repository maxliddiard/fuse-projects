import crypto from "crypto";

interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

interface WebhookTextMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text";
  text: { body: string };
}

interface WebhookMediaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "image" | "document" | "audio" | "video" | "sticker";
  [key: string]: unknown;
  caption?: string;
}

interface WebhookStatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

export type WebhookMessage = WebhookTextMessage | WebhookMediaMessage;

export interface ParsedWebhookPayload {
  phoneNumberId: string;
  messages: Array<{
    externalId: string;
    fromPhone: string;
    fromName: string | null;
    messageType: string;
    textBody: string | null;
    caption: string | null;
    timestamp: Date;
  }>;
  statuses: WebhookStatusUpdate[];
}

export class WhatsAppWebhookService {
  static verifyWebhook(
    mode: string | null,
    token: string | null,
    challenge: string | null,
  ): string | null {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken && challenge) {
      return challenge;
    }
    return null;
  }

  static validateSignature(
    rawBody: string,
    signature: string | null,
  ): boolean {
    if (!signature) return false;

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) return false;

    const expectedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  static parseWebhookPayload(body: unknown): ParsedWebhookPayload | null {
    const payload = body as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          value?: {
            messaging_product?: string;
            metadata?: { phone_number_id?: string };
            contacts?: WebhookContact[];
            messages?: WebhookMessage[];
            statuses?: WebhookStatusUpdate[];
          };
        }>;
      }>;
    };

    if (payload.object !== "whatsapp_business_account") {
      return null;
    }

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.metadata?.phone_number_id) {
      return null;
    }

    const contactMap = new Map<string, string>();
    for (const contact of value.contacts || []) {
      contactMap.set(contact.wa_id, contact.profile.name);
    }

    const messages = (value.messages || []).map((msg) => ({
      externalId: msg.id,
      fromPhone: msg.from,
      fromName: contactMap.get(msg.from) || null,
      messageType: msg.type,
      textBody: msg.type === "text" ? (msg as WebhookTextMessage).text.body : null,
      caption: "caption" in msg && typeof msg.caption === "string" ? msg.caption : null,
      timestamp: new Date(parseInt(msg.timestamp) * 1000),
    }));

    return {
      phoneNumberId: value.metadata.phone_number_id,
      messages,
      statuses: value.statuses || [],
    };
  }
}
