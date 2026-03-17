import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";

function getDisplayName(name: string) {
  switch (name.toUpperCase()) {
    case "INBOX":
      return "Inbox";
    case "[GMAIL]/SENT MAIL":
    case "SENT":
      return "Sent";
    case "[GMAIL]/DRAFTS":
    case "DRAFTS":
      return "Drafts";
    case "[GMAIL]/ALL MAIL":
      return "All Mail";
    case "[GMAIL]/SPAM":
    case "SPAM":
      return "Spam";
    case "[GMAIL]/TRASH":
    case "TRASH":
      return "Trash";
    case "[GMAIL]/STARRED":
    case "STARRED":
      return "Starred";
    case "[GMAIL]/IMPORTANT":
    case "IMPORTANT":
      return "Important";
    default:
      return name;
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

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

  const mailboxes = await prisma.mailbox.findMany({
    where: { accountId },
    select: {
      id: true,
      name: true,
      role: true,
      totalCount: true,
      unreadCount: true,
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const transformedMailboxes = mailboxes.map((mailbox) => ({
    id: mailbox.id,
    name: mailbox.name,
    displayName: getDisplayName(mailbox.name),
    messagesTotal: mailbox.totalCount || mailbox._count.messages,
    messagesUnread: mailbox.unreadCount || 0,
    role: mailbox.role,
  }));

  return NextResponse.json(transformedMailboxes);
}
