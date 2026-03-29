import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { BaileysSessionManager } from "@/features/whatsapp/services/baileys-session-manager";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  const status = BaileysSessionManager.getSessionStatus(accountId);
  if (!status) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  return NextResponse.json(status);
}
