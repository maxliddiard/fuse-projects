"use client";

import { useCallback, useEffect, useState } from "react";

const SYNC_DAY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year" },
];

export function SyncDaysPicker() {
  const [days, setDays] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setDays(data.historySyncDays);
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = async (value: number) => {
    setDays(value);
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historySyncDays: value }),
      });
    } catch {}
    setSaving(false);
  };

  if (days === null) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Analyze last</span>
      <select
        value={days}
        onChange={(e) => handleChange(Number(e.target.value))}
        disabled={saving}
        className="border border-border bg-card px-3 py-2 text-sm text-foreground"
      >
        {SYNC_DAY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
    </div>
  );
}
