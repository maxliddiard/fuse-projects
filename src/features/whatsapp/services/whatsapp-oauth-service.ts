import { OAuthConfigError, OAuthExchangeError } from "@/lib/errors";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getWhatsAppConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return null;
  }

  return { appId, appSecret };
}

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

export class WhatsAppOAuthService {
  static getEmbeddedSignupConfig(): {
    appId: string;
    configId: string;
    permissions: string[];
  } {
    const config = getWhatsAppConfig();
    if (!config) {
      throw new OAuthConfigError(
        "META_APP_ID and META_APP_SECRET must be set",
      );
    }

    return {
      appId: config.appId,
      configId: process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || "",
      permissions: [
        "whatsapp_business_management",
        "whatsapp_business_messaging",
      ],
    };
  }

  static async exchangeCodeForToken(code: string): Promise<string> {
    const config = getWhatsAppConfig();
    if (!config) {
      throw new OAuthConfigError(
        "META_APP_ID and META_APP_SECRET must be set",
      );
    }

    const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    url.searchParams.set("client_id", config.appId);
    url.searchParams.set("client_secret", config.appSecret);
    url.searchParams.set("code", code);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new OAuthExchangeError(
        `Token exchange failed: ${error?.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    return data.access_token;
  }

  static async getBusinessPhoneNumbers(
    accessToken: string,
    waBusinessAccountId: string,
  ): Promise<PhoneNumber[]> {
    const url = `${GRAPH_API_BASE}/${waBusinessAccountId}/phone_numbers`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new OAuthExchangeError(
        `Failed to get phone numbers: ${error?.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    return data.data || [];
  }

  static async getSharedWABAId(
    accessToken: string,
  ): Promise<string | null> {
    const url = `${GRAPH_API_BASE}/debug_token?input_token=${accessToken}`;
    const config = getWhatsAppConfig();
    if (!config) return null;

    const appToken = `${config.appId}|${config.appSecret}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${appToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const granularScopes = data?.data?.granular_scopes || [];
    const waScope = granularScopes.find(
      (s: { scope: string }) => s.scope === "whatsapp_business_management",
    );
    return waScope?.target_ids?.[0] || null;
  }

  static encodeState(data: { userId: string; returnTo: string }): string {
    return Buffer.from(
      JSON.stringify({ ...data, timestamp: Date.now() }),
    ).toString("base64");
  }

  static decodeState(state: string): {
    userId: string;
    returnTo: string;
    timestamp: number;
  } {
    return JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
  }
}
