import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { WhatsAppService } from "@/features/whatsapp/server";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const config = WhatsAppService.getEmbeddedSignupConfig(auth.user.id);
    return NextResponse.json(config);
  } catch (error) {
    console.error("WhatsApp auth config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get WhatsApp config" },
      { status: 500 },
    );
  }
}
