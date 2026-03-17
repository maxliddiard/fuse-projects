import { google } from "googleapis";

import { EmailAccountNotFoundError } from "@/lib/errors";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";

export class GmailApiService {
  private gmail;
  private oauth2Client;
  private accountId: string;

  constructor(accessToken: string, refreshToken?: string, accountId?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    this.accountId = accountId || "";
  }

  static async fromAccountId(accountId: string): Promise<GmailApiService> {
    const credentials = await EmailAccountRepository.getCredentials(accountId);

    if (!credentials) {
      throw new EmailAccountNotFoundError(accountId);
    }

    return new GmailApiService(
      credentials.accessToken,
      credentials.refreshToken || undefined,
      accountId,
    );
  }

  async getProfile() {
    const response = await this.gmail.users.getProfile({ userId: "me" });
    return response.data;
  }

  async listLabels() {
    const response = await this.gmail.users.labels.list({ userId: "me" });
    return response.data.labels || [];
  }

  async listMessages(query?: string, maxResults = 50, pageToken?: string) {
    const response = await this.gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
      pageToken,
    });
    return response.data;
  }

  async getMessage(messageId: string) {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    return response.data;
  }

  async getMessageBatch(messageIds: string[]) {
    const batch = messageIds.map((id) =>
      this.gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      }),
    );
    return Promise.all(batch);
  }

  async sendMessage(
    to: string,
    subject: string,
    body: string,
    isHtml = false,
    cc?: string,
    bcc?: string,
    inReplyTo?: string,
    threadId?: string,
  ) {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
    ];

    if (cc) headers.push(`Cc: ${cc}`);
    if (bcc) headers.push(`Bcc: ${bcc}`);
    if (inReplyTo) {
      headers.push(`In-Reply-To: ${inReplyTo}`);
      headers.push(`References: ${inReplyTo}`);
    }

    const message = [...headers, "", body].join("\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const requestBody: { raw: string; threadId?: string } = {
      raw: encodedMessage,
    };
    if (threadId) {
      requestBody.threadId = threadId;
    }

    const response = await this.gmail.users.messages.send({
      userId: "me",
      requestBody,
    });
    return response.data;
  }

  parseMessageHeaders(headers: Array<{ name?: string | null; value?: string | null }>) {
    const parsed: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.name && header.value) {
        parsed[header.name.toLowerCase()] = header.value;
      }
    });
    return parsed;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractMessageBody(payload: any): { text?: string; html?: string } {
    const result: { text?: string; html?: string } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFromParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          result.text = Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (part.mimeType === "text/html" && part.body?.data) {
          result.html = Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    } else if (payload.body?.data) {
      const content = Buffer.from(payload.body.data, "base64").toString("utf-8");
      if (payload.mimeType === "text/html") {
        result.html = content;
      } else {
        result.text = content;
      }
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractAttachments(payload: any): Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachments: any[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFromParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId,
          });
        }
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }
}
