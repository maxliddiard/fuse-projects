import { Button } from "@/components/ui/button";

import { AuthCard } from "./auth-card";

interface UnverifiedEmailProps {
  email?: string | null;
  resent: boolean;
  loading: boolean;
  onResend: () => void;
  onBackToLogin: () => void;
}

export function UnverifiedEmail({
  email,
  resent,
  loading,
  onResend,
  onBackToLogin,
}: UnverifiedEmailProps) {
  return (
    <AuthCard
      title="Email Verification Required"
      description="Please verify your email to continue."
    >
      <div className="flex flex-col gap-4">
        {!resent ? (
          <Button
            onClick={onResend}
            disabled={!email || loading}
            className="w-full"
          >
            {loading ? "Resending..." : "Resend Verification Email"}
          </Button>
        ) : (
          <p className="text-center text-green-600">
            Verification email resent!
          </p>
        )}
        <Button variant="secondary" onClick={onBackToLogin} className="w-full">
          Back to Log In
        </Button>
      </div>
    </AuthCard>
  );
}
