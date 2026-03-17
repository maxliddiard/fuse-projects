import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const mailboxRole = searchParams.get("mailbox") || "INBOX";

  if (!accountId) {
    return NextResponse.json(
      { message: "Missing account ID" },
      { status: 400 },
    );
  }

  // Verify account belongs to user
  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, userId: auth.user.id },
  });

  if (!account) {
    return NextResponse.json(
      { message: "Account not found" },
      { status: 404 },
    );
  }

  // Find mailbox by role
  const mailbox = await prisma.mailbox.findFirst({
    where: { accountId, role: mailboxRole },
  });

  if (!mailbox) {
    return NextResponse.json([]);
  }

  const messages = await prisma.emailMessage.findMany({
    where: {
      accountId,
      mailboxes: {
        some: { mailboxId: mailbox.id },
      },
    },
    include: {
      mailboxes: {
        include: {
          mailbox: {
            select: { role: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(messages);
}
