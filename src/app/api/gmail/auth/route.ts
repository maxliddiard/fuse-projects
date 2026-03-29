import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { EmailService } from "@/features/email/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gmail/auth/route.ts:8',message:'getAuthenticatedUser result',data:{hasError:'error' in auth, authKeys:Object.keys(auth), errorVal:'error' in auth ? (auth as any).error : null, statusVal:'error' in auth ? (auth as any).status : null},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";

  try {
    const { authUrl } = EmailService.initiateOAuthConnection(auth.user.id, returnTo);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Gmail auth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate auth URL" },
      { status: 500 },
    );
  }
}
