"use client";

import { AppLayout } from "@/components/layout/app-layout";
import MailboxContainer from "@/features/email/components/mailbox-container";

export default function MailboxPage() {
  return (
    <AppLayout>
      <MailboxContainer />
    </AppLayout>
  );
}
