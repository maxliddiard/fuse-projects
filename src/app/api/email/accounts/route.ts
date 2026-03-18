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
    await EmailService.disconnectAccount(accountId, auth.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting account:", error);
    return NextResponse.json(
      { message: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}
