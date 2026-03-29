"use client";

import { ChevronDown, Mail } from "lucide-react";
import { useState } from "react";

import { DEFAULT_EMAIL_CATEGORIZATION_PROMPT } from "@/features/pipeline/constants";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Textarea } from "./textarea";

const LOCALSTORAGE_KEY = "pending_categorization_prompt";

interface ConnectEmailPromptProps {
  onConnect?: (categorizationPrompt: string | null) => void;
  connecting?: boolean;
}

export function ConnectEmailPrompt({ onConnect, connecting: externalConnecting }: ConnectEmailPromptProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_EMAIL_CATEGORIZATION_PROMPT);
  const [internalConnecting, setInternalConnecting] = useState(false);

  const connecting = externalConnecting ?? internalConnecting;

  const isEdited = prompt.trim() !== DEFAULT_EMAIL_CATEGORIZATION_PROMPT.trim();

  const handleConnect = async () => {
    if (onConnect) {
      onConnect(isEdited ? prompt : null);
      return;
    }

    try {
      setInternalConnecting(true);
      if (isEdited) {
        localStorage.setItem(LOCALSTORAGE_KEY, prompt);
      } else {
        localStorage.removeItem(LOCALSTORAGE_KEY);
      }

      const { initiateGmailConnection } = await import(
        "@/features/email/services/email-settings-client-service"
      );
      const returnTo = window.location.pathname;
      const { authUrl } = await initiateGmailConnection(returnTo);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate Gmail connection:", error);
      setInternalConnecting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-8 text-center">
      <div className="bg-muted p-4 text-muted-foreground">
        <Mail className="h-8 w-8" />
      </div>

      <h1 className="mt-8 text-3xl font-normal tracking-tight text-foreground">
        Connect your email to get started
      </h1>
      <p className="mt-3 text-muted-foreground">
        Fuse Projects reads your client emails and turns them into branded
        deliverables. Connect your Gmail account to begin.
      </p>

      <div className="mt-6 w-full text-left">
        <button
          type="button"
          onClick={() => setPromptOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              promptOpen && "rotate-180",
            )}
          />
          <span>Customize how AI categorizes your conversations</span>
        </button>

        {promptOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              This prompt tells the AI how to classify the domains you email.
              Edit the category descriptions to match your business.
            </p>
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
      </div>

      <Button
        className="mt-6 w-full max-w-xs"
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? "Connecting..." : "Connect Gmail"}
      </Button>
    </div>
  );
}
