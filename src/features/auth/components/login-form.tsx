"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLogin } from "../hooks/use-login";
import { useLoginForm } from "../hooks/use-login-form";
import { usePasswordResetRequest } from "../hooks/use-password-reset-request";
import { AuthCard } from "./auth-card";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const { navigateToSignup } = useLoginForm();
  const {
    email,
    setEmail,
    password,
    setPassword,
    message,
    isLoading,
    handleLogin,
  } = useLogin();
  const {
    forgotEmail,
    setForgotEmail,
    resetLoading,
    isDialogOpen,
    setIsDialogOpen,
    resetMessage,
    handlePasswordResetRequest,
  } = usePasswordResetRequest();

  return (
    <AuthCard
      title="Log in"
      description="Enter your email and password to log in."
    >
      {verified && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Email verified successfully. Please log in.
        </div>
      )}
      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="text-sm underline-offset-4 hover:underline text-left"
                    />
                  }
                >
                  Forgot password?
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset your password</DialogTitle>
                    <DialogDescription>
                      Enter your email to receive a password reset link.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={handlePasswordResetRequest}
                    className="mt-4 flex flex-col gap-4"
                  >
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    {resetMessage && (
                      <p
                        className={`text-sm ${resetMessage.type === "success" ? "text-green-600" : "text-red-500"}`}
                      >
                        {resetMessage.text}
                      </p>
                    )}
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </div>
      </form>

      {message && <p className="mt-2 text-red-500">{message}</p>}

      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={navigateToSignup}
          className="underline underline-offset-4"
        >
          Sign up
        </button>
      </div>
    </AuthCard>
  );
}
