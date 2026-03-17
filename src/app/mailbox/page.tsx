"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import MailboxContainer from "@/features/email/components/mailbox-container";

export default function MailboxPage() {
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
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Mailbox
        </Link>
        <Link
          href="/settings/email"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
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

      <MailboxContainer />
    </div>
  );
}
