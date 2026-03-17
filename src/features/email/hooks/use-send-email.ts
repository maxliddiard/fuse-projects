"use client";

import { useState } from "react";
import { toast } from "sonner";

interface EmailData {
  accountId: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  message: string;
  isHtml?: boolean;
  inReplyTo?: string;
}

export function useSendEmail() {
  const [sending, setSending] = useState(false);

  const sendEmail = async (emailData: EmailData) => {
    const toField = Array.isArray(emailData.to)
      ? emailData.to.join(",")
      : emailData.to;
    if (!toField.trim() || !emailData.message.trim()) {
      toast.error("Please fill in recipient and message");
      return false;
    }

    setSending(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: emailData.accountId,
          to: Array.isArray(emailData.to) ? emailData.to.join(",") : emailData.to.trim(),
          cc: Array.isArray(emailData.cc)
            ? emailData.cc.join(",")
            : emailData.cc?.trim() || undefined,
          bcc: Array.isArray(emailData.bcc)
            ? emailData.bcc.join(",")
            : emailData.bcc?.trim() || undefined,
          subject: emailData.subject.trim(),
          message: emailData.message,
          isHtml: emailData.isHtml,
          inReplyTo: emailData.inReplyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }

      toast.success("Email sent successfully!");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  return { sending, sendEmail };
}
