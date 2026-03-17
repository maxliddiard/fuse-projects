"use client";

import { Mail } from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { useConnectGmail } from "@/features/email/hooks/use-connect-gmail";
import { useEmailAccounts } from "@/features/email/hooks/use-email-accounts";
import { ProjectsContainer } from "@/features/projects/components/projects-container";

function ConnectEmailPrompt() {
  const { connect, connecting } = useConnectGmail();

  return (
    <main className="mx-auto max-w-lg px-8 py-32 text-center">
      <div className="flex justify-center">
        <div className="bg-muted p-4 text-muted-foreground">
          <Mail className="h-8 w-8" />
        </div>
      </div>

      <h1 className="mt-8 text-3xl font-light tracking-tight text-foreground">
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
    </main>
  );
}

function Dashboard() {
  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <h1 className="text-3xl font-light tracking-tight text-foreground">
        Projects
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Discovered accounts from your email, categorized by relationship type.
      </p>

      <div className="mt-8">
        <ProjectsContainer />
      </div>
    </main>
  );
}

export default function Home() {
  const { accounts, loading } = useEmailAccounts();
  const hasEmail = accounts.length > 0;

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin border-b-2 border-foreground" />
        </div>
      ) : hasEmail ? (
        <Dashboard />
      ) : (
        <ConnectEmailPrompt />
      )}
    </AppLayout>
  );
}
