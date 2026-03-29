"use client";

import { useState } from "react";

import {
  getWhatsAppAuthConfig,
  completeWhatsAppSignup,
  type WhatsAppAccountDTO,
} from "../services/whatsapp-settings-client-service";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
            [key: string]: unknown;
          };
          status: string;
        }) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: { setup: Record<string, unknown> };
        },
      ) => void;
    };
  }
}

function loadFacebookSDK(appId: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      window.FB!.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

export function useConnectWhatsApp() {
  const [connecting, setConnecting] = useState(false);

  const connect = async (): Promise<WhatsAppAccountDTO | null> => {
    try {
      setConnecting(true);
      const config = await getWhatsAppAuthConfig();

      await loadFacebookSDK(config.appId);

      return new Promise((resolve) => {
        window.FB!.login(
          async (response) => {
            if (response.authResponse?.code) {
              try {
                const account = await completeWhatsAppSignup({
                  code: response.authResponse.code,
                  phoneNumber: "",
                  phoneNumberId: "",
                  waBusinessAccountId: "",
                });
                resolve(account);
              } catch (error) {
                console.error("WhatsApp signup completion failed:", error);
                resolve(null);
              }
            } else {
              console.error("WhatsApp login cancelled or failed");
              resolve(null);
            }
            setConnecting(false);
          },
          {
            config_id: config.configId,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              setup: {},
            },
          },
        );
      });
    } catch (error) {
      console.error("Failed to initiate WhatsApp connection:", error);
      setConnecting(false);
      return null;
    }
  };

  return { connect, connecting };
}
