"use client";

import { Suspense } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { EmailAccountsManager } from "@/features/email/components/email-accounts-manager";
import { WhatsAppAccountsManager } from "@/features/whatsapp/components/whatsapp-accounts-manager";
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
      <SectionHeader>Appearance</SectionHeader>
      <p className="mt-1 text-sm text-muted-foreground">
        Customize the look of your workspace
      </p>
      <div className="mt-3">
        <Button onClick={cycle}>
          {BG_LABELS[bgKey]}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-8 py-16">
        <div className="space-y-8">
          <PageHeader title="Settings" size="sm" />

          <Separator />

          <section className="space-y-4">
            <div>
              <SectionHeader>Email</SectionHeader>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your Gmail account to discover and categorize contacts
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
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <SectionHeader>WhatsApp</SectionHeader>
              <p className="mt-1 text-sm text-muted-foreground">
                Import your WhatsApp conversations to discover and categorize contacts
              </p>
            </div>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              }
            >
              <WhatsAppAccountsManager />
            </Suspense>
          </section>

          <Separator />

          <BackgroundPicker />
        </div>
      </main>
    </AppLayout>
  );
}
