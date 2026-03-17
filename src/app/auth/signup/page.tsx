import { Suspense } from "react";

import { SignupForm } from "@/features/auth";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
