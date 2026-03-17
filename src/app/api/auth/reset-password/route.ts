import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/features/auth/server";
import {
  formatErrorResponse,
  getErrorStatusCode,
  isOperationalError,
} from "@/lib/errors";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    await AuthService.resetPasswordByToken(token, password);

    return NextResponse.json({ message: "Password reset successfully." });
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

    console.error("Password reset error:", {
      code: isOperationalError(error) ? error.code : "UNKNOWN",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(formatErrorResponse(error), {
      status: getErrorStatusCode(error),
    });
  }
}
