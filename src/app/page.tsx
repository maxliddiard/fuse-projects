"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { ConnectEmailPrompt } from "@/components/ui/connect-email-prompt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useEmailAccounts } from "@/features/email/hooks/use-email-accounts";
import { useWhatsAppAccounts } from "@/features/whatsapp/hooks/use-whatsapp-accounts";
import { ProjectsContainer } from "@/features/projects/components/projects-container";

function Dashboard() {
  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <PageHeader
        title="Projects"
        description="Discovered accounts from your connected inboxes, categorized by relationship type."
        size="sm"
      />

      <div className="mt-8">
        <ProjectsContainer />
      </div>
    </main>
  );
}

export default function Home() {
  const { accounts: emailAccounts, loading: emailLoading, refetch } = useEmailAccounts();
  const { accounts: waAccounts, loading: waLoading } = useWhatsAppAccounts();
  const searchParams = useSearchParams();

  const loading = emailLoading || waLoading;
  const hasAnyAccount = emailAccounts.length > 0 || waAccounts.length > 0;

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      toast.success("Your Gmail account has been connected successfully.");
      refetch();
    } else if (error) {
      toast.error(`Failed to connect Gmail: ${error.replace(/_/g, " ")}`);
    }
  }, [searchParams, refetch]);

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      ) : hasAnyAccount ? (
        <Dashboard />
      ) : (
        <ConnectEmailPrompt />
      )}
    </AppLayout>
  );
}
