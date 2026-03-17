import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  size?: "default" | "sm";
  className?: string;
}

export function PageHeader({
  title,
  description,
  size = "default",
  className,
}: PageHeaderProps) {
  return (
    <div className={className}>
      <h1
        className={cn(
          "font-light tracking-tight text-foreground",
          size === "default" ? "text-4xl" : "text-2xl",
        )}
      >
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "text-muted-foreground",
            size === "default" ? "mt-4 text-lg" : "mt-1 text-sm",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
