import { WhatsAppAccountRepository } from "@/lib/repositories/whatsapp-account-repository";
import { ResourceNotFoundError } from "@/lib/errors";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface SendMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppApiService {
  private accessToken: string;
  private phoneNumberId: string;
  private accountId: string;

  constructor(accessToken: string, phoneNumberId: string, accountId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.accountId = accountId;
  }

  static async fromAccountId(accountId: string): Promise<WhatsAppApiService> {
    const credentials = await WhatsAppAccountRepository.getCredentials(accountId);
    if (!credentials) {
      throw new ResourceNotFoundError("WhatsAppAccount", accountId);
    }

    return new WhatsAppApiService(
      credentials.accessToken,
      credentials.phoneNumberId,
      accountId,
    );
  }

  async sendTextMessage(to: string, body: string): Promise<SendMessageResponse> {
    const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `WhatsApp send failed: ${error?.error?.message || response.statusText}`,
      );
    }

    return response.json();
  }

  async markAsRead(messageId: string): Promise<void> {
    const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    const url = `${GRAPH_API_BASE}/${mediaId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get media URL for ${mediaId}`);
    }

    const data = await response.json();
    return data.url;
  }

  async getBusinessProfile(): Promise<{
    about: string;
    address: string;
    description: string;
    vertical: string;
    websites: string[];
  }> {
    const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,vertical,websites`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to get WhatsApp business profile");
    }

    const data = await response.json();
    return data.data?.[0] || {};
  }
}
