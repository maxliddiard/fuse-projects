"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ConnectEmailPrompt } from "@/components/ui/connect-email-prompt";
import { useEmailAccounts } from "@/features/email/hooks/use-email-accounts";

export default function ActionsPage() {
  const { accounts, loading } = useEmailAccounts();
  const hasEmail = accounts.length > 0;

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin border-b-2 border-foreground" />
        </div>
      ) : hasEmail ? (
        <main className="mx-auto max-w-3xl px-8 py-16">
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Actions
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            AI-powered actions will appear here.
          </p>
        </main>
      ) : (
        <ConnectEmailPrompt />
      )}
    </AppLayout>
  );
}
