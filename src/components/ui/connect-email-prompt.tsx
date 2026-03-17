"use client";

import { Mail } from "lucide-react";

import { useConnectGmail } from "@/features/email/hooks/use-connect-gmail";

import { Button } from "./button";

export function ConnectEmailPrompt() {
  const { connect, connecting } = useConnectGmail();

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-8 text-center">
      <div className="bg-muted p-4 text-muted-foreground">
        <Mail className="h-8 w-8" />
      </div>

      <h1 className="mt-8 text-3xl font-normal tracking-tight text-foreground">
        Connect your email to get started
      </h1>
      <p className="mt-3 text-muted-foreground">
        Fuse Projects reads your client emails and turns them into branded
        deliverables. Connect your Gmail account to begin.
      </p>

      <Button
        className="mt-8 w-full max-w-xs"
        onClick={connect}
        disabled={connecting}
      >
        {connecting ? "Connecting..." : "Connect Gmail"}
      </Button>
    </div>
  );
}
