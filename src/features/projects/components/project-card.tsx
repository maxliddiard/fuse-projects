"use client";

import { format } from "date-fns";

import type { DiscoveredAccountDTO } from "../hooks/use-projects";

import { SalesInsightsPanel } from "./sales-insights-panel";

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  SALES: {
    label: "Sales",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  MANAGEMENT: {
    label: "Management",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

interface ProjectCardProps {
  project: DiscoveredAccountDTO;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const badge = project.category
    ? CATEGORY_BADGES[project.category]
    : null;

  return (
    <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {project.displayName || project.domain}
          </h3>
          {project.displayName && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {project.domain}
            </p>
          )}
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{project.messageCount} messages</span>
        {project.isBidirectional && <span>Bidirectional</span>}
        {project.lastSeenAt && (
          <span>
            Last contact: {format(new Date(project.lastSeenAt), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {project.categoryReason && (
        <p className="mt-2 text-xs text-zinc-500 italic dark:text-zinc-400">
          {project.categoryReason}
        </p>
      )}

      {project.category === "SALES" && project.salesInsights && (
        <SalesInsightsPanel insightsJson={project.salesInsights} />
      )}
    </div>
  );
}
