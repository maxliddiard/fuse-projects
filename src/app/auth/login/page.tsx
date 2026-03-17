import { Suspense } from "react";

import { LoginForm } from "@/features/auth";

export default function AuthPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
