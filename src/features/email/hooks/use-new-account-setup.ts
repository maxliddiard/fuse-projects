"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const LOCALSTORAGE_KEY = "pending_categorization_prompt";

export function useNewAccountSetup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledRef = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const accountId = searchParams.get("accountId");

    if (success === "new_account" && accountId && !handledRef.current) {
      handledRef.current = true;

      const categorizationPrompt = localStorage.getItem(LOCALSTORAGE_KEY);
      localStorage.removeItem(LOCALSTORAGE_KEY);

      fetch(`/api/email/accounts/${accountId}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorizationPrompt: categorizationPrompt || undefined,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Setup failed");
          toast.success("Gmail connected — analyzing your inbox...");
        })
        .catch(() => {
          toast.error("Account connected, but analysis failed to start.");
        });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      params.delete("accountId");
      const remaining = params.toString();
      router.replace(remaining ? `${pathname}?${remaining}` : pathname);
    }
  }, [searchParams, router, pathname]);
}
