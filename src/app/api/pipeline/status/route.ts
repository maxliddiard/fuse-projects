import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 },
    );
  }

  // Verify account ownership
  const account = await EmailAccountRepository.findByIdAndUser(
    accountId,
    auth.user.id,
  );
  if (!account) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 },
    );
  }

  const latestRun = await prisma.pipelineRun.findFirst({
    where: { emailAccountId: accountId },
    orderBy: { createdAt: "desc" },
  });

  if (!latestRun) {
    return NextResponse.json({ run: null });
  }

  return NextResponse.json({ run: latestRun });
}
