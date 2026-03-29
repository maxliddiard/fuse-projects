import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { WhatsAppService } from "@/features/whatsapp/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { code, phoneNumber, phoneNumberId, waBusinessAccountId, displayName } = body;

  if (!code || !phoneNumber || !phoneNumberId || !waBusinessAccountId) {
    return NextResponse.json(
      { error: "Missing required fields: code, phoneNumber, phoneNumberId, waBusinessAccountId" },
      { status: 400 },
    );
  }

  try {
    const account = await WhatsAppService.completeEmbeddedSignup({
      code,
      userId: auth.user.id,
      phoneNumber,
      phoneNumberId,
      waBusinessAccountId,
      displayName,
    });

    return NextResponse.json({
      id: account.id,
      phoneNumber: account.phoneNumber,
      displayName: account.displayName,
      status: account.status,
    });
  } catch (error) {
    console.error("WhatsApp callback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect WhatsApp" },
      { status: 500 },
    );
  }
}
