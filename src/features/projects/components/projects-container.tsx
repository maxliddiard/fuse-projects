"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ActivityStatusBanner } from "@/components/ui/activity-status-banner";
import { useAccounts } from "@/features/email/hooks/use-accounts";
import { useWhatsAppAccounts } from "@/features/whatsapp/hooks/use-whatsapp-accounts";
import { useSyncStatus } from "@/features/email/hooks/use-sync-status";
import { cn } from "@/lib/utils";

import { usePipelineStatus } from "../hooks/use-pipeline-status";
import { useProjects } from "../hooks/use-projects";
import { useTriggerPipeline } from "../hooks/use-trigger-pipeline";

import { ProjectCard } from "./project-card";

type SourceTab = "EMAIL" | "WHATSAPP";

function AccountProjectsPanel({
  accountId,
  sourceType,
}: {
  accountId: string;
  sourceType: SourceTab;
}) {
  const { trigger, triggering } = useTriggerPipeline();
  const { run, startPolling: startPipelinePolling } = usePipelineStatus(accountId);
  const { status: syncStatus, startPolling: startSyncPolling } = useSyncStatus(
    sourceType === "EMAIL" ? accountId : null,
  );

  const isRunning = run?.status === "RUNNING";
  const isSyncing = syncStatus?.syncStatus === "SYNCING";
  const isActive = isRunning || isSyncing;

  const { projects, loading: projectsLoading } = useProjects(accountId, isActive, sourceType);

  const handleRunAnalysis = async () => {
    await trigger(accountId);
    startPipelinePolling();
    if (sourceType === "EMAIL") startSyncPolling();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={handleRunAnalysis}
          disabled={triggering || isRunning || isSyncing}
          className="bg-info text-info-foreground hover:bg-info/90"
        >
          {isSyncing ? "Syncing..." : isRunning ? "Running..." : "Run Analysis"}
        </Button>
      </div>

      {sourceType === "EMAIL" && (
        <ActivityStatusBanner syncStatus={syncStatus} pipelineRun={run} />
      )}

      {projectsLoading ? (
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 && !isRunning && !isSyncing ? (
        <div className="border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No accounts discovered yet. Click &quot;Run Analysis&quot; to analyze your{" "}
            {sourceType === "WHATSAPP" ? "WhatsApp conversations" : "email"}.
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

export function ProjectsContainer() {
  const { accounts: emailAccounts, loading: emailLoading } = useAccounts();
  const { accounts: waAccounts, loading: waLoading } = useWhatsAppAccounts();
  const [activeTab, setActiveTab] = useState<SourceTab>("EMAIL");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null);

  const accountsLoading = emailLoading || waLoading;

  if (accountsLoading) {
    return <p className="text-sm text-muted-foreground">Loading accounts...</p>;
  }

  const hasEmail = emailAccounts.length > 0;
  const hasWhatsApp = waAccounts.length > 0;

  if (!hasEmail && !hasWhatsApp) {
    return (
      <div className="border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No accounts connected. Connect a Gmail or WhatsApp account in Settings to get started.
        </p>
      </div>
    );
  }

  const tabs: { key: SourceTab; label: string; icon: typeof Mail; available: boolean }[] = [
    { key: "EMAIL", label: "Email", icon: Mail, available: hasEmail },
    { key: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, available: hasWhatsApp },
  ];

  const effectiveTab = tabs.find((t) => t.key === activeTab)?.available
    ? activeTab
    : tabs.find((t) => t.available)?.key || "EMAIL";

  const emailAccountId = selectedEmailId || emailAccounts[0]?.id || null;
  const waAccountId = selectedWaId || waAccounts[0]?.id || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-border">
        {tabs
          .filter((t) => t.available)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = effectiveTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm transition-colors duration-200",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
      </div>

      {effectiveTab === "EMAIL" && hasEmail && (
        <div className="space-y-4">
          {emailAccounts.length > 1 && (
            <select
              value={emailAccountId || ""}
              onChange={(e) => setSelectedEmailId(e.target.value)}
              className="border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {emailAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.emailAddress}
                </option>
              ))}
            </select>
          )}
          {emailAccountId && (
            <AccountProjectsPanel accountId={emailAccountId} sourceType="EMAIL" />
          )}
        </div>
      )}

      {effectiveTab === "WHATSAPP" && hasWhatsApp && (
        <div className="space-y-4">
          {waAccounts.length > 1 && (
            <select
              value={waAccountId || ""}
              onChange={(e) => setSelectedWaId(e.target.value)}
              className="border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {waAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.phoneNumber}
                </option>
              ))}
            </select>
          )}
          {waAccountId && (
            <AccountProjectsPanel accountId={waAccountId} sourceType="WHATSAPP" />
          )}
        </div>
      )}
    </div>
  );
}
