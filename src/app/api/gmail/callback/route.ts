import { NextRequest, NextResponse } from "next/server";

import { EmailService } from "@/features/email/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/email?error=${error}`, baseUrl),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings/email?error=missing_params", baseUrl),
    );
  }

  try {
    await EmailService.completeOAuthCallback(code, state);
    return NextResponse.redirect(
      new URL("/settings/email?success=connected", baseUrl),
    );
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/settings/email?error=oauth_failed`, baseUrl),
    );
  }
}
