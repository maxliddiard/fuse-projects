"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import React from "react";

interface UseLoginResult {
  email: string;
  setEmail: (_email: string) => void;
  password: string;
  setPassword: (_password: string) => void;
  message: string;
  isLoading: boolean;
  handleLogin: (_e: React.FormEvent) => Promise<void>;
}

async function waitForSession(maxRetries = 3, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    const session = await getSession();
    if (session?.user) return session;
  }
  return null;
}

export function useLogin(): UseLoginResult {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.ok) {
        const session = await waitForSession();

        if (!(session?.user as any)?.emailVerifiedAt) {
          router.push(`/auth/unverified?email=${email}`);
        } else {
          const redirectUrl = searchParams.get("redirect");
          const safeRedirect =
            redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : null;
          router.push(safeRedirect || "/");
        }
      } else if (
        result?.error === "invalid_credentials" ||
        result?.error === "CredentialsSignin"
      ) {
        setMessage("Invalid email or password.");
      } else {
        setMessage("Unexpected error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    message,
    isLoading,
    handleLogin,
  };
}
