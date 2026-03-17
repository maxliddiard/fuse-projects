"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { EmailMessage } from "../types";

export function useMessages(accountId: string, selectedMailbox: string) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!accountId || !selectedMailbox) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/email/messages?accountId=${accountId}&mailbox=${selectedMailbox}`,
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [accountId, selectedMailbox]);

  useEffect(() => {
    if (accountId && selectedMailbox) {
      fetchMessages();
    }
  }, [accountId, selectedMailbox, fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
}
