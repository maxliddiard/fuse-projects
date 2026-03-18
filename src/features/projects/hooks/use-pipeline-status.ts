"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const prevRunning = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!accountId) return null;
    try {
      setLoading(true);
      const response = await fetch(`/api/pipeline/status?accountId=${accountId}`);
      if (!response.ok) return null;
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

  const startPolling = useCallback(() => {
    // no-op — polling is now automatic
  }, []);

  useEffect(() => {
    fetchStatus();

    intervalRef.current = setInterval(async () => {
      const current = await fetchStatus();
      if (!current) return;

      if (prevRunning.current && current.status !== "RUNNING") {
        if (current.status === "COMPLETED") {
          toast.success(
            `Analysis complete — ${current.accountsFound} accounts found, ${current.accountsCategorized} categorized, ${current.salesExplored} sales analyzed`,
          );
        } else if (current.status === "FAILED") {
          toast.error(current.error || "Pipeline failed");
        }
        onComplete?.();
      }
      prevRunning.current = current.status === "RUNNING";
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, onComplete]);

  return { run, loading, refetch: fetchStatus, startPolling };
}
