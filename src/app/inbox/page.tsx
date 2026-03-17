"use client";

import { AppLayout } from "@/components/layout/app-layout";

const messages = [
  {
    id: 1,
    from: "Alice Chen",
    subject: "Design review for landing page",
    preview: "Hey, can you take a look at the latest mockups? I've updated the hero section based on last week's feedback...",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    from: "Bob Martinez",
    subject: "API integration update",
    preview: "The new endpoints are live in staging. We should schedule a quick sync to go over the changes before...",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    from: "Carol Kim",
    subject: "Sprint planning notes",
    preview: "Attached are the notes from today's planning session. Key decisions: we're prioritizing the auth flow...",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 4,
    from: "Dan Okafor",
    subject: "Bug report: dashboard loading",
    preview: "Users are reporting slow load times on the dashboard when there are more than 50 items. I've opened...",
    time: "2 days ago",
    unread: false,
  },
];

export default function Inbox() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-8 py-16">
        <h1 className="text-4xl font-light tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.filter((m) => m.unread).length} unread messages
        </p>

        <div className="mt-8 divide-y divide-border border border-border">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col gap-1 px-6 py-4 transition-colors duration-200 hover:bg-card"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    msg.unread
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.from}
                  {msg.unread && (
                    <span className="ml-2 inline-block h-2 w-2 bg-foreground" />
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {msg.time}
                </span>
              </div>
              <span
                className={`text-sm ${
                  msg.unread
                    ? "font-normal text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {msg.subject}
              </span>
              <span className="text-sm text-muted-foreground line-clamp-1">
                {msg.preview}
              </span>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
