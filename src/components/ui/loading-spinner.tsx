import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function LoadingSpinner({
  size = "default",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin border-b-2 border-foreground",
        sizeClasses[size],
        className,
      )}
    />
  );
}
