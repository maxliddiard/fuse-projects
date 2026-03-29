"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchWhatsAppAccounts,
  type WhatsAppAccountDTO,
} from "../services/whatsapp-settings-client-service";

export function useWhatsAppAccounts() {
  const [accounts, setAccounts] = useState<WhatsAppAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWhatsAppAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load WhatsApp accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeAccount = useCallback((accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  }, []);

  return { accounts, loading, removeAccount, refetch: load };
}
