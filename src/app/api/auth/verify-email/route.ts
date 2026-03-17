import { NextResponse } from "next/server";

import { AuthService } from "@/features/auth/server";
import { isOperationalError } from "@/lib/errors";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "Token is required", code: "MISSING_REQUIRED_FIELD" },
      { status: 400 },
    );
  }

  const baseUrl = new URL(req.url).origin;

  try {
    await AuthService.verifyEmailByToken(token);

    return NextResponse.redirect(
      `${baseUrl}/auth/login?verified=true`,
    );
  } catch (error) {
    console.error("Email verification error:", {
      code: isOperationalError(error) ? error.code : "UNKNOWN",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    const code = isOperationalError(error) ? error.code : "UNKNOWN";
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${code}`,
    );
  }
}
