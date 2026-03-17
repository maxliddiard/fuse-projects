"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";

interface SalesInsights {
  contacts: Array<{ name: string; email: string; role: string }>;
  dealStage: string;
  recentActivitySummary: string;
  keyTopics: string[];
}

interface SalesInsightsPanelProps {
  insightsJson: string;
}

export function SalesInsightsPanel({ insightsJson }: SalesInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  let insights: SalesInsights;
  try {
    insights = JSON.parse(insightsJson);
  } catch {
    return null;
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {expanded ? "Hide insights" : "View sales insights"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <Badge variant="secondary">{insights.dealStage}</Badge>
          </div>

          {insights.recentActivitySummary && (
            <p className="text-xs text-muted-foreground">
              {insights.recentActivitySummary}
            </p>
          )}

          {insights.contacts.length > 0 && (
            <div>
              <p className="text-xs font-normal text-foreground">
                Contacts
              </p>
              <div className="mt-1 space-y-1">
                {insights.contacts.map((contact, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {contact.name}
                    {contact.role && ` (${contact.role})`}
                    {contact.email && ` — ${contact.email}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {insights.keyTopics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {insights.keyTopics.map((topic, i) => (
                <Badge key={i} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
