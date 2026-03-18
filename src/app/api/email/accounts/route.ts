import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { EmailService } from "@/features/email/server";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const accounts = await EmailService.listAccounts(auth.user.id);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error listing email accounts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("id");

  if (!accountId) {
    return NextResponse.json(
      { message: "Missing account ID" },
      { status: 400 },
    );
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/email/accounts/route.ts:DELETE',message:'disconnect-start',data:{accountId},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    await EmailService.disconnectAccount(accountId, auth.user.id);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/email/accounts/route.ts:DELETE',message:'disconnect-success',data:{accountId},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ success: true });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1e1bfd83-74ce-4756-947d-8b60e9e11940',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/email/accounts/route.ts:DELETE',message:'disconnect-error',data:{accountId,error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    console.error("Error disconnecting account:", error);
    return NextResponse.json(
      { message: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}
