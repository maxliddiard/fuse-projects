"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fuse-bg";

export const APP_BACKGROUNDS = {
  warm: "linear-gradient(135deg, hsl(40 55% 95%) 0%, hsl(28 65% 89%) 50%, hsl(20 70% 86%) 100%)",
  pale: "linear-gradient(135deg, hsl(40 40% 97%) 0%, hsl(28 45% 94%) 50%, hsl(20 50% 92%) 100%)",
  lavender:
    "linear-gradient(135deg, hsl(30 70% 93%) 0%, hsl(40 50% 91%) 35%, hsl(300 30% 92%) 70%, hsl(270 40% 91%) 100%)",
  grey: "linear-gradient(135deg, hsl(0 0% 97%) 0%, hsl(0 0% 94%) 50%, hsl(0 0% 92%) 100%)",
} as const;

export type BgKey = keyof typeof APP_BACKGROUNDS;

const BG_LABELS: Record<BgKey, string> = {
  warm: "Warm Orange",
  pale: "Pale Orange",
  lavender: "Peach Lavender",
  grey: "Eggshell",
};

export { BG_LABELS };

function getSnapshot(): BgKey {
  if (typeof window === "undefined") return "pale";
  return (localStorage.getItem(STORAGE_KEY) as BgKey) || "pale";
}

function getServerSnapshot(): BgKey {
  return "pale";
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("bg-change", callback);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("bg-change", callback);
  };
}

export function useBackgroundPreference() {
  const bgKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setBgKey = useCallback((key: BgKey) => {
    localStorage.setItem(STORAGE_KEY, key);
    window.dispatchEvent(new Event("bg-change"));
  }, []);

  return { bgKey, setBgKey, background: APP_BACKGROUNDS[bgKey] };
}
