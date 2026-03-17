"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Suspense } from "react";

import { Separator } from "@/components/ui/separator";
import { EmailAccountsManager } from "@/features/email/components/email-accounts-manager";

export default function EmailSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="flex items-center gap-6 border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Fuse Projects
        </span>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Home
        </Link>
        <Link
          href="/mailbox"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Mailbox
        </Link>
        <Link
          href="/settings/email"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Settings
        </Link>
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="ml-auto text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        )}
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-16">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Email Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Connect your Gmail account to send and receive emails
            </p>
          </div>
          <Separator />
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
              </div>
            }
          >
            <EmailAccountsManager />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
