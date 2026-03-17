"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Mailbox", href: "/mailbox" },
  { label: "Settings", href: "/settings/email" },
] as const;

// Background options — uncomment to switch
// Default:        (no style override, uses bg-background from globals.css)
// Peach→Lavender: "linear-gradient(135deg, hsl(30 70% 93%) 0%, hsl(40 50% 91%) 35%, hsl(300 30% 92%) 70%, hsl(270 40% 91%) 100%)"
// Warm Cream:
const APP_BG =
  "linear-gradient(135deg, hsl(40 55% 95%) 0%, hsl(28 65% 89%) 50%, hsl(20 70% 86%) 100%)";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen bg-background font-sans"
      style={{ background: APP_BG }}
    >
      <nav className="flex items-center gap-6 border-b border-border px-8 py-4">
        <span className="text-lg font-light text-foreground">
          Fuse Projects
        </span>
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors duration-200",
                isActive
                  ? "font-normal text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="ml-auto text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Sign out
          </button>
        )}
      </nav>

      {children}
    </div>
  );
}
