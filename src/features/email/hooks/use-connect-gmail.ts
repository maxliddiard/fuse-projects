"use client";

import { useState } from "react";

import { initiateGmailConnection } from "../services/email-settings-client-service";

export function useConnectGmail() {
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    try {
      setConnecting(true);
      const returnTo = window.location.pathname;
      const { authUrl } = await initiateGmailConnection(returnTo);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate Gmail connection:", error);
      setConnecting(false);
    }
  };

  return { connect, connecting };
}
