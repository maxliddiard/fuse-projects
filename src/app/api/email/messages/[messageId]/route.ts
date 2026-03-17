import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { messageId } = await params;

  if (!messageId) {
    return NextResponse.json(
      { message: "Missing message ID" },
      { status: 400 },
    );
  }

  try {
    const message = await prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        account: { userId: auth.user.id },
      },
      include: {
        body: true,
        addresses: true,
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            isInline: true,
          },
        },
        mailboxes: {
          include: {
            mailbox: {
              select: { role: true, name: true },
            },
          },
        },
        conversation: {
          select: { id: true, subject: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
