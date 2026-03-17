"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { Mailbox } from "../types";

export function useMailboxes(accountId: string) {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMailboxes = useCallback(async () => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `/api/email/mailboxes?accountId=${accountId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch mailboxes");
      const data = await response.json();
      setMailboxes(data);
    } catch {
      toast.error("Failed to load mailboxes");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchMailboxes();
    }
  }, [accountId, fetchMailboxes]);

  return { mailboxes, loading, refetch: fetchMailboxes };
}
