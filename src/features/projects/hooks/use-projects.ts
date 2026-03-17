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

export function useProjects(accountId: string | null) {
  const [projects, setProjects] = useState<DiscoveredAccountDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/projects?accountId=${accountId}`);
      if (!response.ok) {
        setProjects([]);
        return;
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}
