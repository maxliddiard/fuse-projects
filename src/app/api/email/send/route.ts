import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/features/auth/server";
import { EmailService } from "@/features/email/server";

const sendEmailSchema = z.object({
  accountId: z.string().min(1),
  to: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
  isHtml: z.boolean().default(false),
  inReplyTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const data = sendEmailSchema.parse(body);

    const result = await EmailService.sendEmail({
      ...data,
      userId: auth.user.id,
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          message: `Invalid input: ${firstIssue?.message || "Validation failed"}`,
        },
        { status: 400 },
      );
    }

    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        message: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
