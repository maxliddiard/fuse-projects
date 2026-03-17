"use client";

import { useCallback, useEffect, useState } from "react";

import type { EmailAccountDTO } from "../types";
import { fetchEmailAccounts } from "../services/email-settings-client-service";

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmailAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load email accounts:", error);
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
