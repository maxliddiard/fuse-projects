import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { BaileysSessionManager } from "@/features/whatsapp/services/baileys-session-manager";

export async function POST() {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await BaileysSessionManager.startSession(auth.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to start WhatsApp history session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 500 },
    );
  }
}
