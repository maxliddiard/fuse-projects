import { NextRequest, NextResponse } from "next/server";

import { EmailService } from "@/features/email/server";
import { GmailOAuthService } from "@/features/email/services/gmail-oauth-service";

const FALLBACK_REDIRECT = "/settings/email";

function buildRedirect(path: string, params: string, baseUrl: string) {
  return NextResponse.redirect(new URL(`${path}?${params}`, baseUrl));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;

  if (error) {
    return buildRedirect(FALLBACK_REDIRECT, `error=${error}`, baseUrl);
  }

  if (!code || !state) {
    return buildRedirect(FALLBACK_REDIRECT, "error=missing_params", baseUrl);
  }

  const { returnTo } = GmailOAuthService.decodeState(state);
  const redirectPath = returnTo || FALLBACK_REDIRECT;

  try {
    const { account, isNew } = await EmailService.completeOAuthCallback(code, state);
    if (isNew) {
      return buildRedirect(
        redirectPath,
        `success=new_account&accountId=${account.id}`,
        baseUrl,
      );
    }
    return buildRedirect(redirectPath, "success=connected", baseUrl);
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return buildRedirect(redirectPath, "error=oauth_failed", baseUrl);
  }
}
