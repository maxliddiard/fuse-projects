"use client";

import { useCallback, useEffect, useState } from "react";

export interface DiscoveredAccountDTO {
  id: string;
  emailAccountId: string;
  domain: string;
  displayName: string | null;
  emailAddresses: string;
  messageCount: number;
  sentCount: number;
  receivedCount: number;
  isBidirectional: boolean;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  category: string | null;
  categoryReason: string | null;
  salesInsights: string | null;
  categorizedAt: string | null;
  exploredAt: string | null;
}

export function useProjects(accountId: string | null, isActive = false) {
  const [projects, setProjects] = useState<DiscoveredAccountDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(
    async (silent = false) => {
      if (!accountId) return;
      try {
        if (!silent) setLoading(true);
        const response = await fetch(`/api/projects?accountId=${accountId}`);
        if (!response.ok) {
          if (!silent) setProjects([]);
          return;
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
        if (!silent) setProjects([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchProjects(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchProjects, isActive]);

  return { projects, loading, refetch: fetchProjects };
}
