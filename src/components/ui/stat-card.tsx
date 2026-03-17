import Link from "next/link";

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

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
      <SectionHeader as="p">{label}</SectionHeader>
      <p className="mt-2 text-2xl font-normal tracking-tight text-foreground">
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
