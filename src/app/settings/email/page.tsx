"use client";

import { Suspense } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { EmailAccountsManager } from "@/features/email/components/email-accounts-manager";
import {
  APP_BACKGROUNDS,
  BG_LABELS,
  useBackgroundPreference,
  type BgKey,
} from "@/hooks/use-background-preference";

const BG_KEYS = Object.keys(APP_BACKGROUNDS) as BgKey[];

function BackgroundPicker() {
  const { bgKey, setBgKey } = useBackgroundPreference();
  const currentIndex = BG_KEYS.indexOf(bgKey);

  const cycle = () => {
    const next = BG_KEYS[(currentIndex + 1) % BG_KEYS.length];
    setBgKey(next);
  };

  return (
    <div>
      <SectionHeader>Background</SectionHeader>
      <div className="mt-3">
        <Button onClick={cycle}>
          {BG_LABELS[bgKey]}
        </Button>
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-8 py-16">
        <div className="space-y-6">
          <PageHeader
            title="Settings"
            size="sm"
          />
          <Separator />
          <div>
            <SectionHeader>Email</SectionHeader>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Gmail account to send and receive emails
            </p>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            }
          >
            <EmailAccountsManager />
          </Suspense>
          <Separator />
          <BackgroundPicker />
        </div>
      </main>
    </AppLayout>
  );
}
