"use client";

import { format } from "date-fns";
import { Mail, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from "../config/categories";
import type { DiscoveredAccountDTO } from "../hooks/use-projects";

import { SalesInsightsPanel } from "./sales-insights-panel";

interface ProjectCardProps {
  project: DiscoveredAccountDTO;
}

function SourceIcon({ sourceType }: { sourceType: string }) {
  if (sourceType === "WHATSAPP") {
    return <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (sourceType === "BOTH") {
    return (
      <div className="flex gap-1">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }
  return <Mail className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const categoryConfig = project.category
    ? PROJECT_CATEGORIES[project.category as ProjectCategory]
    : null;

  const identifier = project.domain || project.phoneNumber;
  const title = project.displayName || identifier;
  const subtitle =
    project.displayName && identifier !== project.displayName
      ? identifier
      : null;

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5">
            <SourceIcon sourceType={project.sourceType} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-normal text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {categoryConfig && (
          <Badge variant={categoryConfig.variant}>
            {categoryConfig.label}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{project.messageCount} messages</span>
        {project.isBidirectional && <span>Bidirectional</span>}
        {project.lastSeenAt && (
          <span>
            Last contact: {format(new Date(project.lastSeenAt), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {project.categoryReason && (
        <p className="mt-2 text-xs italic text-muted-foreground">
          {project.categoryReason}
        </p>
      )}

      {project.category === "SALES" && project.salesInsights && (
        <SalesInsightsPanel insightsJson={project.salesInsights} />
      )}
    </div>
  );
}
