"use client";

import { useState } from "react";

export function useResendVerification() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resendVerification = async (email: string) => {
    if (!email) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setResent(true);
      }
    } catch (error) {
      console.error("Failed to resend verification:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    resent,
    loading,
    resendVerification,
  };
}
