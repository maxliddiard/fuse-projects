"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resetPasswordSchema } from "../utils/password-validation";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetMessage {
  type: "success" | "error";
  text: string;
}

export function useResetPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const token = useSearchParams().get("token");
  const router = useRouter();
  const [message, setMessage] = useState<ResetMessage | null>(null);

  const onSubmit = async (data: ResetPasswordValues) => {
    const { password } = data;
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setMessage({
        type: "success",
        text: "Password reset successfully. Redirecting to login...",
      });
      await signOut({ redirect: false });
      router.push("/auth/login");
    } else {
      setMessage({
        type: "error",
        text: "Failed to reset password. Please try again or request a new reset link.",
      });
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    message,
    onSubmit,
  };
}
