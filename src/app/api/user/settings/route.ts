import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import prisma from "@/lib/prisma/client";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { historySyncDays: true },
  });

  return NextResponse.json({ historySyncDays: user?.historySyncDays ?? 90 });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { historySyncDays } = body as { historySyncDays?: number };

  if (historySyncDays !== undefined) {
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { historySyncDays: Math.max(7, Math.min(365, historySyncDays)) },
    });
  }

  return NextResponse.json({ success: true });
}
