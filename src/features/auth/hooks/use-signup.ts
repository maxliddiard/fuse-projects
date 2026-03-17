"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { signupSchema } from "@/features/auth/utils/password-validation";

type SignupFormValues = z.infer<typeof signupSchema>;

export function useSignup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const onSubmit = async (data: SignupFormValues) => {
    setMessage("");
    setStatus("idle");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (res.ok) {
        setSubmittedEmail(data.email);
        setMessage(
          "Sign up succeeded. Please check your inbox to verify your email address.",
        );
        setStatus("success");
      } else {
        setMessage(result.message || "Sign up failed. Please try again.");
        setStatus("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    message,
    status,
    isLoading,
    submittedEmail,
    onSubmit,
  };
}
