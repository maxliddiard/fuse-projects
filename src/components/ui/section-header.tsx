import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  children: React.ReactNode;
  as?: "h2" | "h3" | "p";
  className?: string;
}

export function SectionHeader({
  children,
  as: Tag = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <Tag
      className={cn(
        "text-xs font-normal uppercase tracking-[0.15em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
