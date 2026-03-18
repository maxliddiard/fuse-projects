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
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setPolling(true);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!polling) return;

    intervalRef.current = setInterval(async () => {
      const currentRun = await fetchStatus();
      if (currentRun && currentRun.status !== "RUNNING") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPolling(false);
        if (currentRun.status === "COMPLETED") {
          toast.success(
            `Analysis complete — ${currentRun.accountsFound} accounts found, ${currentRun.accountsCategorized} categorized, ${currentRun.salesExplored} sales analyzed`,
          );
        } else if (currentRun.status === "FAILED") {
          toast.error(currentRun.error || "Pipeline failed");
        }
        onComplete?.();
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polling, fetchStatus, onComplete]);

  return { run, loading, refetch: fetchStatus, startPolling };
}
