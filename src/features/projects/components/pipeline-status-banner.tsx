"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

import type { PipelineRunDTO } from "../hooks/use-pipeline-status";

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovering accounts...",
  CATEGORIZATION: "Categorizing accounts...",
  EXPLORATION: "Analyzing sales relationships...",
};

interface PipelineStatusBannerProps {
  run: PipelineRunDTO | null;
}

export function PipelineStatusBanner({ run }: PipelineStatusBannerProps) {
  if (!run || run.status !== "RUNNING") return null;

  return (
    <div className="border border-info bg-info px-4 py-3">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" className="border-info-foreground" />
        <div>
          <p className="text-sm font-normal text-info-foreground">
            {STAGE_LABELS[run.stage] || run.stage}
          </p>
          <p className="text-xs text-info-foreground/70">
            {run.accountsFound > 0 && `${run.accountsFound} accounts found`}
            {run.accountsCategorized > 0 && ` · ${run.accountsCategorized} categorized`}
            {run.salesExplored > 0 && ` · ${run.salesExplored} sales analyzed`}
          </p>
        </div>
      </div>
    </div>
  );
}
