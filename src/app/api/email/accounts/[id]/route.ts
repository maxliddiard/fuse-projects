import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: accountId } = await params;

  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, userId: auth.user.id },
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { categorizationPrompt } = body as {
      categorizationPrompt?: string | null;
    };

    if (categorizationPrompt !== undefined) {
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { categorizationPrompt: categorizationPrompt || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating email account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
