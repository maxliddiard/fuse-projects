import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { PipelineOrchestrator } from "@/features/pipeline/server";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";
import { WhatsAppAccountRepository } from "@/lib/repositories/whatsapp-account-repository";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const accountId = body.accountId;

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 },
    );
  }

  const emailAccount = await EmailAccountRepository.findByIdAndUser(
    accountId,
    auth.user.id,
  );
  const waAccount = !emailAccount
    ? await WhatsAppAccountRepository.findByIdAndUser(accountId, auth.user.id)
    : null;

  if (!emailAccount && !waAccount) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 },
    );
  }

  const isWhatsApp = !!waAccount;
  const runWhere = isWhatsApp
    ? { whatsAppAccountId: accountId }
    : { emailAccountId: accountId };

  const existingRun = await prisma.pipelineRun.findFirst({
    where: { ...runWhere, status: "RUNNING" },
  });

  if (existingRun) {
    return NextResponse.json(
      { runId: existingRun.id, status: "RUNNING", message: "Pipeline already running" },
      { status: 409 },
    );
  }

  const run = await prisma.pipelineRun.create({
    data: {
      ...runWhere,
      sourceType: isWhatsApp ? "WHATSAPP" : "EMAIL",
      status: "RUNNING",
      stage: "DISCOVERY",
    },
  });

  if (isWhatsApp) {
    PipelineOrchestrator.runForWhatsAppAccount(accountId).catch((err) => {
      console.error("WhatsApp pipeline run failed:", err);
    });
  } else {
    PipelineOrchestrator.runForAccount(accountId).catch((err) => {
      console.error("Email pipeline run failed:", err);
    });
  }

  return NextResponse.json({ runId: run.id, status: "RUNNING" });
}
