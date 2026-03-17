import { google } from "googleapis";

import { OAuthConfigError, OAuthExchangeError } from "@/lib/errors";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "email",
  "profile",
];

function getGmailConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/gmail/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

function createOAuth2Client() {
  const config = getGmailConfig();
  if (!config) return null;
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );
}

export class GmailOAuthService {
  static getAuthUrl(state: string): string {
    const oauth2Client = createOAuth2Client();
    if (!oauth2Client) {
      throw new OAuthConfigError(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set",
      );
    }

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GMAIL_SCOPES,
      prompt: "consent",
      state,
    });
  }

  static async exchangeCode(code: string) {
    const oauth2Client = createOAuth2Client();
    if (!oauth2Client) {
      throw new OAuthConfigError(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set",
      );
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresIn: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : undefined,
      };
    } catch (error) {
      throw new OAuthExchangeError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  static async getUserInfo(accessToken: string) {
    const oauth2Client = createOAuth2Client();
    if (!oauth2Client) {
      throw new OAuthConfigError(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set",
      );
    }

    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id!,
        email: data.email!,
        name: data.name ?? undefined,
        picture: data.picture ?? undefined,
      };
    } catch (error) {
      throw new OAuthExchangeError(
        `Failed to get user info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  static async refreshAccessToken(refreshToken: string) {
    const oauth2Client = createOAuth2Client();
    if (!oauth2Client) {
      throw new OAuthConfigError(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set",
      );
    }

    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token!,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : undefined,
      };
    } catch (error) {
      throw new OAuthExchangeError(
        `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  static encodeState(data: { userId: string }): string {
    return Buffer.from(
      JSON.stringify({ ...data, timestamp: Date.now() }),
    ).toString("base64");
  }

  static decodeState(state: string): { userId: string; timestamp: number } {
    return JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
  }
}
