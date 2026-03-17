"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useResendVerification } from "../hooks/use-resend-verification";
import { UnverifiedEmail } from "./unverified-email";

export function UnverifiedContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const { resent, loading, resendVerification } = useResendVerification();

  const handleResend = () => {
    if (email) {
      resendVerification(email);
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <UnverifiedEmail
      email={email}
      resent={resent}
      loading={loading}
      onResend={handleResend}
      onBackToLogin={handleBackToLogin}
    />
  );
}
