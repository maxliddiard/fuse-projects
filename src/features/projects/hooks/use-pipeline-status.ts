"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PipelineRunDTO {
  id: string;
  emailAccountId: string;
  status: string;
  stage: string;
  accountsFound: number;
  accountsCategorized: number;
  salesExplored: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export function usePipelineStatus(
  accountId: string | null,
  onComplete?: () => void,
) {
  const [run, setRun] = useState<PipelineRunDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/pipeline/status?accountId=${accountId}`);
      if (!response.ok) return;
      const data = await response.json();
      setRun(data.run);
      return data.run as PipelineRunDTO | null;
    } catch (err) {
      console.error("Failed to fetch pipeline status:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Poll while pipeline is running
  useEffect(() => {
    fetchStatus();

    intervalRef.current = setInterval(async () => {
      const currentRun = await fetchStatus();
      if (currentRun && currentRun.status !== "RUNNING") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete?.();
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, onComplete]);

  return { run, loading, refetch: fetchStatus };
}
