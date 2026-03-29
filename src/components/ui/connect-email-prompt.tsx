"use client";

import { ChevronDown, Mail, MessageCircle, Wand2 } from "lucide-react";
import { useState } from "react";

import {
  DEFAULT_EMAIL_CATEGORIZATION_PROMPT,
  DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT,
} from "@/features/pipeline/constants";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Textarea } from "./textarea";

const LOCALSTORAGE_KEY = "pending_categorization_prompt";

type SelectedSource = null | "email" | "whatsapp";

export function ConnectEmailPrompt() {
  const [selected, setSelected] = useState<SelectedSource>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [connecting, setConnecting] = useState(false);

  const defaultPrompt =
    selected === "whatsapp"
      ? DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT
      : DEFAULT_EMAIL_CATEGORIZATION_PROMPT;

  const isEdited = selected && prompt.trim() !== defaultPrompt.trim();

  const handleSelect = (source: SelectedSource) => {
    setSelected(source);
    setPromptOpen(false);
    setPrompt(
      source === "whatsapp"
        ? DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT
        : DEFAULT_EMAIL_CATEGORIZATION_PROMPT,
    );
  };

  const handleContinue = async () => {
    if (selected === "email") {
      try {
        setConnecting(true);
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
        setConnecting(false);
      }
    } else if (selected === "whatsapp") {
      window.location.href = "/settings/email";
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-8 text-center">
      <h1 className="text-3xl font-normal tracking-tight text-foreground">
        Connect your accounts to get started
      </h1>
      <p className="mt-3 text-muted-foreground">
        Fuse Projects analyzes your conversations and turns them into
        categorized projects. Connect Gmail, WhatsApp, or both.
      </p>

      {!selected && (
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button className="w-full" onClick={() => handleSelect("email")}>
            <Mail className="mr-2 h-4 w-4" />
            Connect Gmail
          </Button>
          <Button className="w-full" onClick={() => handleSelect("whatsapp")}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Connect WhatsApp
          </Button>
        </div>
      )}

      {selected && (
        <div className="mt-8 w-full max-w-md space-y-4">
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
                  onClick={() => setPrompt(defaultPrompt)}
                  className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Reset to default
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Button
              className="w-full max-w-xs"
              onClick={handleContinue}
              disabled={connecting}
            >
              {selected === "email" && (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {connecting ? "Connecting..." : "Continue with Gmail"}
                </>
              )}
              {selected === "whatsapp" && (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Continue with WhatsApp
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
