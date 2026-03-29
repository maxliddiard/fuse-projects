"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Textarea } from "./textarea";

interface CategorizationPromptEditorProps {
  accountId: string;
  currentPrompt: string | null;
  defaultPrompt: string;
  onSave: (accountId: string, prompt: string | null) => Promise<void>;
  label?: string;
}

export function CategorizationPromptEditor({
  accountId,
  currentPrompt,
  defaultPrompt,
  onSave,
  label = "Customize how your conversations are categorized",
}: CategorizationPromptEditorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(currentPrompt || defaultPrompt);
  const [saving, setSaving] = useState(false);

  const isDefault = prompt.trim() === defaultPrompt.trim();
  const hasUnsavedChanges =
    (currentPrompt === null && !isDefault) ||
    (currentPrompt !== null && prompt.trim() !== currentPrompt.trim());

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(accountId, isDefault ? null : prompt);
      toast.success("Categorization prompt updated.");
    } catch {
      toast.error("Failed to update categorization prompt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span>{label}</span>
        {currentPrompt && (
          <span className="text-xs text-info-foreground">(customized)</span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="text-xs leading-relaxed"
          />
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
            {!isDefault && (
              <button
                type="button"
                onClick={() => setPrompt(defaultPrompt)}
                className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Reset to default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
