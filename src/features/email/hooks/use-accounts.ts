"use client";

import { useCallback, useEffect, useState } from "react";

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  status: string;
  createdAt: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/email/accounts");
      if (!response.ok) {
        setAccounts([]);
        return;
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/email/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete account");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      return true;
    } catch (err) {
      console.error("Failed to delete account:", err);
      return false;
    }
  }, []);

  const initiateGmailOAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/gmail/auth");
      if (!response.ok) throw new Error("Failed to initiate OAuth");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    refetch: fetchAccounts,
    deleteAccount,
    initiateGmailOAuth,
  };
}
