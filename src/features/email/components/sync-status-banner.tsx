"use client";

import type { SyncStatus } from "../hooks/use-sync-status";

interface SyncStatusBannerProps {
  status: SyncStatus | null;
}

export function SyncStatusBanner({ status }: SyncStatusBannerProps) {
  if (!status || status.syncStatus === "IDLE") return null;

  if (status.syncStatus === "SYNCING") {
    const pct =
      status.totalMessages > 0
        ? Math.round((status.syncedMessages / status.totalMessages) * 100)
        : 0;

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Syncing emails...
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {status.syncedMessages.toLocaleString()} of{" "}
              ~{status.totalMessages.toLocaleString()} messages synced
              {status.totalMessages > 0 && ` (${pct}%)`}
            </p>
          </div>
          {status.totalMessages > 0 && (
            <div className="h-1.5 w-24 rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status.syncStatus === "FAILED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">
          Email sync failed
        </p>
      </div>
    );
  }

  return null;
}
