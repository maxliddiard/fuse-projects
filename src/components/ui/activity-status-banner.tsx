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

  const segments: string[] = [];

  if (isSyncing) {
    segments.push("Scanning emails…");
  }

  if (isRunning) {
    const label = STAGE_LABELS[pipelineRun.stage] || pipelineRun.stage;
    const details = [
      pipelineRun.accountsFound > 0 &&
        `${pipelineRun.accountsFound} accounts found`,
      pipelineRun.accountsCategorized > 0 &&
        `${pipelineRun.accountsCategorized} categorized`,
      pipelineRun.salesExplored > 0 &&
        `${pipelineRun.salesExplored} sales analyzed`,
    ].filter(Boolean);
    segments.push(details.length > 0 ? `${label} ${details.join(", ")}` : label);
  }

  return (
    <div className="border border-info/20 bg-info/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" className="border-info" />
        <p className="text-sm text-foreground">
          {segments.join(" · ")}
        </p>
      </div>
    </div>
  );
}
