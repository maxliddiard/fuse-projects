import Link from "next/link";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, href, className }: StatCardProps) {
  const classes = cn(
    "border border-border bg-card p-6 transition-colors duration-200",
    href && "hover:border-foreground/20",
    className,
  );

  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-light tracking-tight text-foreground">
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
