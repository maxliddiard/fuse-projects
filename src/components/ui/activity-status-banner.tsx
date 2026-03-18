"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { SyncStatus } from "@/features/email/hooks/use-sync-status";
import type { PipelineRunDTO } from "@/features/projects/hooks/use-pipeline-status";

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovering accounts…",
  CATEGORIZATION: "Categorizing accounts…",
  EXPLORATION: "Analyzing sales relationships…",
};

interface ActivityStatusBannerProps {
  syncStatus: SyncStatus | null;
  pipelineRun: PipelineRunDTO | null;
}

export function ActivityStatusBanner({
  syncStatus,
  pipelineRun,
}: ActivityStatusBannerProps) {
  const isSyncing = syncStatus?.syncStatus === "SYNCING";
  const isRunning = pipelineRun?.status === "RUNNING";

  if (!isSyncing && !isRunning) return null;

  return (
    <div className="border border-info/20 bg-info/10 px-4 py-3">
      <div className="space-y-2">
        {isSyncing && <SyncLine status={syncStatus} />}
        {isRunning && <PipelineLine run={pipelineRun} />}
      </div>
    </div>
  );
}

function SyncLine({ status }: { status: SyncStatus }) {
  const effectiveTotal = Math.max(status.syncedMessages, status.totalMessages);
  const pct =
    effectiveTotal > 0
      ? Math.min(Math.round((status.syncedMessages / effectiveTotal) * 100), 100)
      : 0;

  return (
    <div className="flex items-center gap-3">
      <LoadingSpinner size="sm" className="border-info" />
      <div>
        <p className="text-sm text-foreground">Syncing emails…</p>
        <p className="text-xs text-muted-foreground">
          {status.syncedMessages.toLocaleString()} of{" "}
          ~{effectiveTotal.toLocaleString()} messages synced
          {effectiveTotal > 0 && ` (${pct}%)`}
        </p>
      </div>
    </div>
  );
}

function PipelineLine({ run }: { run: PipelineRunDTO }) {
  const details = [
    run.accountsFound > 0 && `${run.accountsFound} accounts found`,
    run.accountsCategorized > 0 && `${run.accountsCategorized} categorized`,
    run.salesExplored > 0 && `${run.salesExplored} sales analyzed`,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3">
      <LoadingSpinner size="sm" className="border-info" />
      <div>
        <p className="text-sm text-foreground">
          {STAGE_LABELS[run.stage] || run.stage}
        </p>
        {details.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {details.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
