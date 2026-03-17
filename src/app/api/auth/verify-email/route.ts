import { NextResponse } from "next/server";

import { AuthService } from "@/features/auth/server";
import {
  formatErrorResponse,
  getErrorStatusCode,
  isOperationalError,
} from "@/lib/errors";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "Token is required", code: "MISSING_REQUIRED_FIELD" },
      { status: 400 },
    );
  }

  try {
    await AuthService.verifyEmailByToken(token);

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email verification error:", {
      code: isOperationalError(error) ? error.code : "UNKNOWN",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(formatErrorResponse(error), {
      status: getErrorStatusCode(error),
    });
  }
}
