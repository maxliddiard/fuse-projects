import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";
import { WhatsAppAccountRepository } from "@/lib/repositories/whatsapp-account-repository";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const sourceType = searchParams.get("sourceType") || "EMAIL";

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 },
    );
  }

  if (sourceType === "WHATSAPP") {
    const account = await WhatsAppAccountRepository.findByIdAndUser(
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
      where: { whatsAppAccountId: accountId },
      orderBy: [{ lastSeenAt: "desc" }],
    });

    return NextResponse.json(sortByCategory(projects));
  }

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
    orderBy: [{ lastSeenAt: "desc" }],
  });

  return NextResponse.json(sortByCategory(projects));
}

const CATEGORY_ORDER: Record<string, number> = {
  SALES: 0,
  INVESTOR: 1,
  SUPPLIER: 2,
  MANAGEMENT: 3,
  OTHER: 4,
};

function sortByCategory<T extends { category: string | null; lastSeenAt: Date | null }>(
  projects: T[],
): T[] {
  return projects.sort((a, b) => {
    const aOrder = a.category ? (CATEGORY_ORDER[a.category] ?? 3) : 3;
    const bOrder = b.category ? (CATEGORY_ORDER[b.category] ?? 3) : 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aDate = a.lastSeenAt?.getTime() ?? 0;
    const bDate = b.lastSeenAt?.getTime() ?? 0;
    return bDate - aDate;
  });
}
