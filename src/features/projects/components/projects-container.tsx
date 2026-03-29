"use client";

import { ChevronDown, Mail, MessageCircle, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActivityStatusBanner } from "@/components/ui/activity-status-banner";
import { useAccounts } from "@/features/email/hooks/use-accounts";
import {
  DEFAULT_EMAIL_CATEGORIZATION_PROMPT,
  DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT,
} from "@/features/pipeline/constants";
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

const PENDING_PROMPT_KEY = "pending_categorization_prompt";

function ConnectEmailPanel() {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_EMAIL_CATEGORIZATION_PROMPT);
  const [connecting, setConnecting] = useState(false);

  const isEdited = prompt.trim() !== DEFAULT_EMAIL_CATEGORIZATION_PROMPT.trim();

  const handleConnect = async () => {
    try {
      setConnecting(true);
      if (isEdited) {
        localStorage.setItem(PENDING_PROMPT_KEY, prompt);
      } else {
        localStorage.removeItem(PENDING_PROMPT_KEY);
      }
      const { initiateGmailConnection } = await import(
        "@/features/email/services/email-settings-client-service"
      );
      const { authUrl } = await initiateGmailConnection(window.location.pathname);
      window.location.href = authUrl;
    } catch {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Mail className="h-10 w-10 text-muted-foreground/40" />
      <h2 className="mt-4 text-xl font-normal tracking-tight text-foreground">
        Connect Gmail
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Link your Gmail account to discover projects from your email conversations.
      </p>

      <div className="mt-6 w-full max-w-md space-y-4">
        <button
          type="button"
          onClick={() => setPromptOpen((v) => !v)}
          className="mx-auto flex items-center gap-2 text-sm transition-colors duration-200 hover:opacity-80"
        >
          <Wand2 className="h-4 w-4 text-info" />
          <span className="text-info">
            Customize how AI categorizes your conversations
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-info transition-transform duration-200",
              promptOpen && "rotate-180",
            )}
          />
        </button>

        {promptOpen && (
          <div className="space-y-2 text-left">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="text-xs leading-relaxed"
            />
            {isEdited && (
              <button
                type="button"
                onClick={() => setPrompt(DEFAULT_EMAIL_CATEGORIZATION_PROMPT)}
                className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Reset to default
              </button>
            )}
          </div>
        )}

        <Button
          className="w-full max-w-xs"
          onClick={handleConnect}
          disabled={connecting}
        >
          <Mail className="mr-2 h-4 w-4" />
          {connecting ? "Connecting..." : "Connect Gmail"}
        </Button>
      </div>
    </div>
  );
}

function ConnectWhatsAppPanel() {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT);

  const isEdited = prompt.trim() !== DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT.trim();

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
      <h2 className="mt-4 text-xl font-normal tracking-tight text-foreground">
        Connect WhatsApp
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Link your WhatsApp account to discover projects from your conversations.
      </p>

      <div className="mt-6 w-full max-w-md space-y-4">
        <button
          type="button"
          onClick={() => setPromptOpen((v) => !v)}
          className="mx-auto flex items-center gap-2 text-sm transition-colors duration-200 hover:opacity-80"
        >
          <Wand2 className="h-4 w-4 text-info" />
          <span className="text-info">
            Customize how AI categorizes your conversations
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-info transition-transform duration-200",
              promptOpen && "rotate-180",
            )}
          />
        </button>

        {promptOpen && (
          <div className="space-y-2 text-left">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="text-xs leading-relaxed"
            />
            {isEdited && (
              <button
                type="button"
                onClick={() => setPrompt(DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT)}
                className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Reset to default
              </button>
            )}
          </div>
        )}

        <Button asChild className="w-full max-w-xs">
          <Link href="/settings/email" className="inline-flex items-center justify-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            Connect WhatsApp
          </Link>
        </Button>
      </div>
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

  const tabs: { key: SourceTab; label: string; icon: typeof Mail }[] = [
    { key: "EMAIL", label: "Email", icon: Mail },
    { key: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  ];

  const emailAccountId = selectedEmailId || emailAccounts[0]?.id || null;
  const waAccountId = selectedWaId || waAccounts[0]?.id || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
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

      {activeTab === "EMAIL" && hasEmail && (
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

      {activeTab === "EMAIL" && !hasEmail && <ConnectEmailPanel />}

      {activeTab === "WHATSAPP" && hasWhatsApp && (
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

      {activeTab === "WHATSAPP" && !hasWhatsApp && <ConnectWhatsAppPanel />}
    </div>
  );
}
