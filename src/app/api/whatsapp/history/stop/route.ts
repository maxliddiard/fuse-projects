import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { BaileysSessionManager } from "@/features/whatsapp/services/baileys-session-manager";
import { PipelineOrchestrator } from "@/features/pipeline/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { accountId } = body as { accountId: string };

    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const status = BaileysSessionManager.getSessionStatus(accountId);
    await BaileysSessionManager.disconnectSession(accountId);

    if (status?.status === "completed" || status?.status === "syncing") {
      PipelineOrchestrator.runForWhatsAppAccount(accountId).catch((err) => {
        console.error("WhatsApp pipeline failed after history sync:", err);
      });
    }

    return NextResponse.json({ success: true, messagesImported: status?.messagesImported ?? 0 });
  } catch (error) {
    console.error("Failed to stop WhatsApp history session:", error);
    return NextResponse.json(
      { error: "Failed to stop session" },
      { status: 500 },
    );
  }
}
