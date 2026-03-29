"use client";

import { Home, LogOut, Mail, PanelLeft, PanelLeftClose, Settings, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { useBackgroundPreference } from "@/hooks/use-background-preference";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "AI-detected projects", href: "/", icon: Home },
  { label: "Actions", href: "/actions", icon: Wand2 },
  { label: "Emails", href: "/mailbox", icon: Mail },
  { label: "Settings", href: "/settings/email", icon: Settings },
] as const;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { background } = useBackgroundPreference();

  return (
    <div className="flex min-h-screen bg-background" style={{ background }}>
      <aside
        className={cn(
          "flex shrink-0 flex-col overflow-hidden border-r border-border bg-card/60 transition-[width] duration-200",
          collapsed ? "w-14" : "w-52",
        )}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          {!collapsed && (
            <span className="text-lg font-normal text-foreground whitespace-nowrap">
              Team Projects
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "text-muted-foreground transition-colors duration-200 hover:text-foreground",
              collapsed && "mx-auto",
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="ml-auto h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 text-sm transition-colors duration-200",
                  isActive
                    ? "text-foreground font-normal"
                    : "text-muted-foreground hover:text-foreground",
                  collapsed && "justify-center",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {session && (
          <div className="border-t border-border px-2 py-3">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className={cn(
                "flex w-full items-center gap-3 px-2 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground",
                collapsed && "justify-center",
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
