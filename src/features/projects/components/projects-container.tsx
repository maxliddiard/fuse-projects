"use client";

import { useCallback, useState } from "react";

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

  // Auto-select first account
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
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading accounts...
      </p>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No email accounts connected. Connect a Gmail account in Settings to get started.
        </p>
      </div>
    );
  }

  const isRunning = run?.status === "RUNNING";
  const isSyncing = syncStatus?.syncStatus === "SYNCING";

  return (
    <div className="space-y-6">
      {/* Account selector + action bar */}
      <div className="flex items-center gap-4">
        {accounts.length > 1 && (
          <select
            value={accountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.emailAddress}
              </option>
            ))}
          </select>
        )}
        {accounts.length === 1 && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {accounts[0].emailAddress}
          </span>
        )}
        <button
          onClick={handleRunAnalysis}
          disabled={triggering || isRunning || isSyncing}
          className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSyncing ? "Syncing..." : isRunning ? "Running..." : "Run Analysis"}
        </button>
      </div>

      {/* Sync + Pipeline status */}
      <SyncStatusBanner status={syncStatus} />
      <PipelineStatusBanner run={run} />

      {/* Project cards */}
      {projectsLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading projects...
        </p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
