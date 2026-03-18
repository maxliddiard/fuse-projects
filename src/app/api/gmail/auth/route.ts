import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { EmailService } from "@/features/email/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
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
