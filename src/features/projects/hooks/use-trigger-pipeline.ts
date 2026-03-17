"use client";

import { useCallback, useState } from "react";

export function useTriggerPipeline() {
  const [triggering, setTriggering] = useState(false);

  const trigger = useCallback(async (accountId: string) => {
    try {
      setTriggering(true);
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok && response.status !== 409) {
        throw new Error("Failed to trigger pipeline");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Failed to trigger pipeline:", err);
      return null;
    } finally {
      setTriggering(false);
    }
  }, []);

  return { trigger, triggering };
}
