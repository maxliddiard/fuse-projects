import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/features/auth/server";
import {
  formatErrorResponse,
  getErrorStatusCode,
  isOperationalError,
  UserAlreadyExistsError,
} from "@/lib/errors";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const SIGNUP_SUCCESS_MESSAGE =
  "Signup successful! Check your email inbox for a verification email.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);
    const { email, password } = validatedData;

    const result = await AuthService.signupUser({ email, password });

    if (result.token) {
      const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${result.token}`;
      console.log(`\n[DEV] Verification URL for ${email}:\n${verifyUrl}\n`);
    }

    return NextResponse.json({ message: SIGNUP_SUCCESS_MESSAGE });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json({ message: SIGNUP_SUCCESS_MESSAGE });
    }

    console.error("Signup error:", {
      code: isOperationalError(error) ? error.code : "UNKNOWN",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    if (isOperationalError(error)) {
      return NextResponse.json(formatErrorResponse(error), {
        status: getErrorStatusCode(error),
      });
    }

    return NextResponse.json(
      { message: "Error creating account. Please try again." },
      { status: 500 },
    );
  }
}
