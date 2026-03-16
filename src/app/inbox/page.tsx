import Link from "next/link";

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
          href="/inbox"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Inbox
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Inbox
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {messages.filter((m) => m.unread).length} unread messages
        </p>

        <div className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col gap-1 px-6 py-4 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    msg.unread
                      ? "font-semibold text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {msg.from}
                  {msg.unread && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {msg.time}
                </span>
              </div>
              <span
                className={`text-sm ${
                  msg.unread
                    ? "font-medium text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {msg.subject}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {msg.preview}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
