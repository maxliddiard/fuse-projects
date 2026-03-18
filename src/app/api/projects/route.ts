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

  const projects = await prisma.discoveredAccount.findMany({
    where: { emailAccountId: accountId },
    orderBy: [
      { lastSeenAt: "desc" },
    ],
  });

  // Sort by category priority: SALES > MANAGEMENT > OTHER > uncategorized
  const categoryOrder: Record<string, number> = {
    SALES: 0,
    INVESTOR: 1,
    SUPPLIER: 2,
    MANAGEMENT: 3,
    OTHER: 4,
  };

  projects.sort((a, b) => {
    const aOrder = a.category ? (categoryOrder[a.category] ?? 3) : 3;
    const bOrder = b.category ? (categoryOrder[b.category] ?? 3) : 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Within same category, sort by lastSeenAt desc
    const aDate = a.lastSeenAt?.getTime() ?? 0;
    const bDate = b.lastSeenAt?.getTime() ?? 0;
    return bDate - aDate;
  });

  return NextResponse.json(projects);
}
