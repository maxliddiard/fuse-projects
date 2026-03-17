"use client";

import type { PipelineRunDTO } from "../hooks/use-pipeline-status";

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovering accounts...",
  CATEGORIZATION: "Categorizing accounts...",
  EXPLORATION: "Analyzing sales relationships...",
  COMPLETED: "Analysis complete",
};

interface PipelineStatusBannerProps {
  run: PipelineRunDTO | null;
}

export function PipelineStatusBanner({ run }: PipelineStatusBannerProps) {
  if (!run) return null;

  if (run.status === "RUNNING") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {STAGE_LABELS[run.stage] || run.stage}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {run.accountsFound > 0 && `${run.accountsFound} accounts found`}
              {run.accountsCategorized > 0 && ` · ${run.accountsCategorized} categorized`}
              {run.salesExplored > 0 && ` · ${run.salesExplored} sales analyzed`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (run.status === "FAILED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">
          Pipeline failed
        </p>
        {run.error && (
          <p className="text-xs text-red-600 dark:text-red-400">{run.error}</p>
        )}
      </div>
    );
  }

  if (run.status === "COMPLETED") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-900 dark:text-green-100">
          Analysis complete — {run.accountsFound} accounts found, {run.accountsCategorized} categorized, {run.salesExplored} sales analyzed
        </p>
      </div>
    );
  }

  return null;
}
