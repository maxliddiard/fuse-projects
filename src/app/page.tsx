"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ConnectEmailPrompt } from "@/components/ui/connect-email-prompt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useEmailAccounts } from "@/features/email/hooks/use-email-accounts";
import { ProjectsContainer } from "@/features/projects/components/projects-container";

function Dashboard() {
  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <PageHeader
        title="Projects"
        description="Discovered accounts from your email, categorized by relationship type."
        size="sm"
      />

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
          <LoadingSpinner />
        </div>
      ) : hasEmail ? (
        <Dashboard />
      ) : (
        <ConnectEmailPrompt />
      )}
    </AppLayout>
  );
}
