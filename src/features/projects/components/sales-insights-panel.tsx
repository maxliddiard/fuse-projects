"use client";

import { useState } from "react";

interface SalesInsights {
  contacts: Array<{ name: string; email: string; role: string }>;
  dealStage: string;
  recentActivitySummary: string;
  keyTopics: string[];
}

interface SalesInsightsPanelProps {
  insightsJson: string;
}

const STAGE_COLORS: Record<string, string> = {
  "active-customer": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "closed-won": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "negotiation": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "evaluation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "prospecting": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "closed-lost": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "churned": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function SalesInsightsPanel({ insightsJson }: SalesInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  let insights: SalesInsights;
  try {
    insights = JSON.parse(insightsJson);
  } catch {
    return null;
  }

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {expanded ? "Hide insights" : "View sales insights"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Deal Stage */}
          <div>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                STAGE_COLORS[insights.dealStage] ||
                "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {insights.dealStage}
            </span>
          </div>

          {/* Activity Summary */}
          {insights.recentActivitySummary && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {insights.recentActivitySummary}
            </p>
          )}

          {/* Contacts */}
          {insights.contacts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Contacts
              </p>
              <div className="mt-1 space-y-1">
                {insights.contacts.map((contact, i) => (
                  <p key={i} className="text-xs text-zinc-500 dark:text-zinc-400">
                    {contact.name}
                    {contact.role && ` (${contact.role})`}
                    {contact.email && ` — ${contact.email}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Key Topics */}
          {insights.keyTopics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {insights.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
