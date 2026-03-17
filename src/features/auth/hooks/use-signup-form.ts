"use client";

import { useRouter } from "next/navigation";

export function useSignupForm() {
  const router = useRouter();

  const navigateToLogin = () => {
    router.push("/auth/login");
  };

  return {
    navigateToLogin,
  };
}
