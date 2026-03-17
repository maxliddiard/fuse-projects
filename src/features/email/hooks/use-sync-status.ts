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
  const prevSyncing = useRef(false);

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

  useEffect(() => {
    fetchStatus();

    intervalRef.current = setInterval(async () => {
      const current = await fetchStatus();
      if (!current) return;

      // Detect transition from SYNCING → IDLE/FAILED
      if (prevSyncing.current && current.syncStatus !== "SYNCING") {
        onComplete?.();
      }
      prevSyncing.current = current.syncStatus === "SYNCING";
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, onComplete]);

  return { status, refetch: fetchStatus };
}
