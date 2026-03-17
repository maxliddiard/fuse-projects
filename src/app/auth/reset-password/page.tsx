import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
