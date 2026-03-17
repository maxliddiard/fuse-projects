"use client";

import { useState } from "react";
import React from "react";

interface ResetMessage {
  type: "success" | "error";
  text: string;
}

interface UsePasswordResetRequestResult {
  forgotEmail: string;
  setForgotEmail: (_email: string) => void;
  resetLoading: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (_open: boolean) => void;
  resetMessage: ResetMessage | null;
  handlePasswordResetRequest: (_e: React.FormEvent) => Promise<void>;
}

export function usePasswordResetRequest(): UsePasswordResetRequestResult {
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState<ResetMessage | null>(null);

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (res.ok) {
        setResetMessage({
          type: "success",
          text: "Reset link sent! Check your email.",
        });
        setForgotEmail("");
      } else {
        setResetMessage({
          type: "error",
          text: "Failed to send reset link. Please try again.",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return {
    forgotEmail,
    setForgotEmail,
    resetLoading,
    isDialogOpen,
    setIsDialogOpen,
    resetMessage,
    handlePasswordResetRequest,
  };
}
