"use client";

import { useRouter } from "next/navigation";

export function useLoginForm() {
  const router = useRouter();

  const navigateToSignup = () => {
    router.push("/auth/signup");
  };

  return {
    navigateToSignup,
  };
}
