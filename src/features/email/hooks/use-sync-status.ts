"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SyncStatus {
  syncStatus: string;
  syncedMessages: number;
  totalMessages: number;
}

export function useSyncStatus(
  accountId: string | null,
  onComplete?: () => void,
) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!accountId) return null;
    try {
      const response = await fetch("/api/email/accounts");
      if (!response.ok) return null;
      const accounts = await response.json();
      const account = accounts.find(
        (a: { id: string }) => a.id === accountId,
      );
      if (!account) return null;

      const current: SyncStatus = {
        syncStatus: account.syncStatus,
        syncedMessages: account.syncedMessages,
        totalMessages: account.totalMessages,
      };
      setStatus(current);
      return current;
    } catch {
      return null;
    }
  }, [accountId]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      const current = await fetchStatus();
      if (!current || current.syncStatus !== "SYNCING") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
      }
    }, 2000);
  }, [fetchStatus, onComplete]);

  useEffect(() => {
    fetchStatus().then((current) => {
      if (current?.syncStatus === "SYNCING") {
        startPolling();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [fetchStatus, startPolling]);

  return { status, refetch: fetchStatus, startPolling };
}
