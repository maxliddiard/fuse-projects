import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { EmailService } from "@/features/email/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json(
      { message: "Missing account ID" },
      { status: 400 },
    );
  }

  try {
    // Fire-and-forget: start sync in background so the response returns immediately
    EmailService.syncAccount(accountId, auth.user.id).catch((error) => {
      console.error("Background sync error:", error);
    });
    return NextResponse.json({ success: true, started: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        message: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
