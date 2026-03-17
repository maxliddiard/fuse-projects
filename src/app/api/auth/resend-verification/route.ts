import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/features/auth/server";
import {
  formatErrorResponse,
  getErrorStatusCode,
  isOperationalError,
  RateLimitError,
} from "@/lib/errors";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendVerificationSchema.parse(body);

    const result = await AuthService.resendVerificationEmail(email);

    if (result.token) {
      const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${result.token}`;
      console.log(`\n[DEV] Verification URL for ${email}:\n${verifyUrl}\n`);
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Resend verification error:", {
      code: isOperationalError(error) ? error.code : "UNKNOWN",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof RateLimitError && error.retryAfter) {
      return NextResponse.json(formatErrorResponse(error), {
        status: getErrorStatusCode(error),
        headers: { "Retry-After": String(error.retryAfter) },
      });
    }

    return NextResponse.json(formatErrorResponse(error), {
      status: getErrorStatusCode(error),
    });
  }
}
