"use client";

import { format } from "date-fns";

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

export function ProjectCard({ project }: ProjectCardProps) {
  const categoryConfig = project.category
    ? PROJECT_CATEGORIES[project.category as ProjectCategory]
    : null;

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-normal text-foreground">
            {project.displayName || project.domain}
          </h3>
          {project.displayName && (
            <p className="text-xs text-muted-foreground">
              {project.domain}
            </p>
          )}
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
