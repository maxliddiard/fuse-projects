import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/features/auth/server";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = requestResetSchema.parse(body);

    const result = await AuthService.requestPasswordReset(email);

    if (result.token) {
      const baseUrl = new URL(req.url).origin;
      const resetUrl = `${baseUrl}/auth/reset-password?token=${result.token}`;
      console.log(`\n[DEV] Password reset URL for ${email}:\n${resetUrl}\n`);
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    return NextResponse.json(
      { message: "Error processing password reset request" },
      { status: 500 },
    );
  }
}
