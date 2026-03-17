"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { SyncStatusBanner } from "@/features/email/components/sync-status-banner";
import { useAccounts } from "@/features/email/hooks/use-accounts";
import { useSyncStatus } from "@/features/email/hooks/use-sync-status";

import { usePipelineStatus } from "../hooks/use-pipeline-status";
import { useProjects } from "../hooks/use-projects";
import { useTriggerPipeline } from "../hooks/use-trigger-pipeline";

import { PipelineStatusBanner } from "./pipeline-status-banner";
import { ProjectCard } from "./project-card";

export function ProjectsContainer() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const accountId = selectedAccountId || accounts[0]?.id || null;

  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects(accountId);
  const { trigger, triggering } = useTriggerPipeline();

  const handlePipelineComplete = useCallback(() => {
    refetchProjects();
  }, [refetchProjects]);

  const { run } = usePipelineStatus(accountId, handlePipelineComplete);
  const { status: syncStatus } = useSyncStatus(accountId);

  const handleRunAnalysis = async () => {
    if (!accountId) return;
    await trigger(accountId);
  };

  if (accountsLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading accounts...
      </p>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No email accounts connected. Connect a Gmail account in Settings to get started.
        </p>
      </div>
    );
  }

  const isRunning = run?.status === "RUNNING";
  const isSyncing = syncStatus?.syncStatus === "SYNCING";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {accounts.length > 1 && (
          <select
            value={accountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.emailAddress}
              </option>
            ))}
          </select>
        )}
        {accounts.length === 1 && (
          <span className="text-sm text-muted-foreground">
            {accounts[0].emailAddress}
          </span>
        )}
        <Button
          onClick={handleRunAnalysis}
          disabled={triggering || isRunning || isSyncing}
          className="ml-auto bg-info text-info-foreground hover:bg-info/90"
        >
          {isSyncing ? "Syncing..." : isRunning ? "Running..." : "Run Analysis"}
        </Button>
      </div>

      <SyncStatusBanner status={syncStatus} />
      <PipelineStatusBanner run={run} />

      {projectsLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading projects...
        </p>
      ) : projects.length === 0 ? (
        <div className="border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No accounts discovered yet. Click &quot;Run Analysis&quot; to analyze your email.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
