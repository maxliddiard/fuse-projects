"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!run) return null;
  if (dismissed === run.id) return null;

  if (run.status === "RUNNING") {
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

  const dismiss = () => setDismissed(run.id);

  if (run.status === "FAILED") {
    return (
      <div className="flex items-start justify-between border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-normal text-destructive">
            Pipeline failed
          </p>
          {run.error && (
            <p className="text-xs text-destructive">{run.error}</p>
          )}
        </div>
        <button onClick={dismiss} className="text-muted-foreground transition-colors duration-200 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (run.status === "COMPLETED") {
    return (
      <div className="flex items-center justify-between border border-border bg-card px-4 py-3">
        <p className="text-sm font-normal text-foreground">
          Analysis complete — {run.accountsFound} accounts found, {run.accountsCategorized} categorized, {run.salesExplored} sales analyzed
        </p>
        <button onClick={dismiss} className="text-muted-foreground transition-colors duration-200 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
