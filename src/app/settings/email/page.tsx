"use client";

import { Suspense } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { EmailAccountsManager } from "@/features/email/components/email-accounts-manager";

export default function EmailSettingsPage() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-8 py-16">
        <div className="space-y-6">
          <PageHeader
            title="Email Settings"
            description="Connect your Gmail account to send and receive emails"
            size="sm"
          />
          <Separator />
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-b-2 border-foreground"></div>
              </div>
            }
          >
            <EmailAccountsManager />
          </Suspense>
        </div>
      </main>
    </AppLayout>
  );
}
