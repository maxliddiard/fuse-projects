"use client";

import { useState } from "react";

import { disconnectEmailAccount } from "../services/email-settings-client-service";

export function useDisconnectAccount() {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const disconnect = async (accountId: string) => {
    try {
      setDisconnecting(accountId);
      await disconnectEmailAccount(accountId);
      return { success: true };
    } catch (error) {
      console.error("Failed to disconnect account:", error);
      return { success: false };
    } finally {
      setDisconnecting(null);
    }
  };

  return { disconnect, disconnecting };
}
