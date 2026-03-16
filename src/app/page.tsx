import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="flex items-center gap-6 border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Fuse Projects
        </span>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Home
        </Link>
        <Link
          href="/inbox"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Inbox
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to Fuse Projects
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Your central hub for managing projects and collaboration. Get started
          by checking your inbox or exploring the dashboard.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Active Projects
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              3 projects in progress
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Team Members
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              5 collaborators online
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Upcoming Deadlines
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              2 tasks due this week
            </p>
          </div>
          <Link
            href="/inbox"
            className="rounded-xl border border-zinc-200 p-6 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Inbox
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              4 unread messages
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
