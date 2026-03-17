"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ConnectEmailPrompt } from "@/components/ui/connect-email-prompt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useEmailAccounts } from "@/features/email/hooks/use-email-accounts";

export default function ActionsPage() {
  const { accounts, loading } = useEmailAccounts();
  const hasEmail = accounts.length > 0;

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      ) : hasEmail ? (
        <main className="mx-auto max-w-3xl px-8 py-16">
          <PageHeader
            title="Actions"
            description="AI-powered actions will appear here."
          />
        </main>
      ) : (
        <ConnectEmailPrompt />
      )}
    </AppLayout>
  );
}
