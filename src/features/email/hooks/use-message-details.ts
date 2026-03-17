"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { FullEmailMessage } from "../types";

export function useMessageDetails() {
  const [fullMessage, setFullMessage] = useState<FullEmailMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFullMessage = async (messageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/email/messages/${messageId}`);
      if (!response.ok) throw new Error("Failed to fetch message");
      const data = await response.json();
      setFullMessage(data);
    } catch {
      toast.error("Failed to load message content");
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => setFullMessage(null);

  return { fullMessage, loading, fetchFullMessage, clearMessage };
}
