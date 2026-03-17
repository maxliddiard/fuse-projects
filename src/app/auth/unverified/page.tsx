import { Suspense } from "react";

import { UnverifiedContainer } from "@/features/auth";

export default function UnverifiedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnverifiedContainer />
    </Suspense>
  );
}
