import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  leftPanel?: React.ReactNode;
  leftPanelStyle?: React.CSSProperties;
  backgroundStyle?: React.CSSProperties;
}

export function AuthCard({
  title,
  description,
  children,
  className,
  leftPanel,
  leftPanelStyle,
  backgroundStyle,
}: AuthCardProps) {
  if (leftPanel) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <div
          className="hidden lg:flex flex-col justify-center px-16 py-20"
          style={leftPanelStyle}
        >
          {leftPanel}
        </div>

        <div className="flex items-center justify-center bg-card px-8 py-16">
          <div className={cn("w-full max-w-md", className)}>
            <div className="mb-8">
              <h2 className="text-2xl font-normal text-foreground">{title}</h2>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={backgroundStyle}>
      <Card className={cn("w-full max-w-md p-6", className)}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-normal">Fuse Projects</span>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">{children}</CardContent>
      </Card>
    </div>
  );
}
