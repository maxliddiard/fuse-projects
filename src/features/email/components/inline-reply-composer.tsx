"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useSendEmail } from "../hooks/use-send-email";
import type { EmailMessage } from "../types";

interface InlineReplyComposerProps {
  originalMessage: EmailMessage;
  accountId: string;
  onSend?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function InlineReplyComposer({
  originalMessage,
  accountId,
  onSend,
  onCancel,
  className,
}: InlineReplyComposerProps) {
  const { sending, sendEmail } = useSendEmail();
  const [to, setTo] = useState(originalMessage.fromAddress || "");
  const [subject, setSubject] = useState(
    originalMessage.subject?.startsWith("Re:")
      ? originalMessage.subject
      : `Re: ${originalMessage.subject || "(no subject)"}`,
  );
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;

    const success = await sendEmail({
      accountId,
      to,
      cc: cc || undefined,
      subject,
      message: body,
      inReplyTo: originalMessage.id,
    });

    if (success) {
      setBody("");
      onSend?.();
    }
  };

  const handleCancel = () => {
    setBody("");
    setCc("");
    setShowCcBcc(false);
    onCancel?.();
  };

  return (
    <div className={cn("border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">Reply</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            to {originalMessage.fromName || originalMessage.fromAddress}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Reply Form */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm w-8">To</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Cc
            </Button>
          </div>

          {showCcBcc && (
            <div className="flex items-center gap-2">
              <Label className="text-sm w-8">Cc</Label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Carbon copy"
                className="flex-1"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm w-8">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-[120px] resize-none"
        />

        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="gap-2"
            size="sm"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
