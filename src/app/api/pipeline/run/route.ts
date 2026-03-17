import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/server";
import { PipelineOrchestrator } from "@/features/pipeline/server";
import prisma from "@/lib/prisma/client";
import { EmailAccountRepository } from "@/lib/repositories/email-account-repository";

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

  // Check no pipeline already running
  const existingRun = await prisma.pipelineRun.findFirst({
    where: {
      emailAccountId: accountId,
      status: "RUNNING",
    },
  });

  if (existingRun) {
    return NextResponse.json(
      { runId: existingRun.id, status: "RUNNING", message: "Pipeline already running" },
      { status: 409 },
    );
  }

  // Create the run record first so we can return the ID immediately
  const run = await prisma.pipelineRun.create({
    data: {
      emailAccountId: accountId,
      status: "RUNNING",
      stage: "DISCOVERY",
    },
  });

  // Fire and forget — don't await the pipeline
  PipelineOrchestrator.runForAccount(accountId).catch((err) => {
    console.error("Pipeline run failed (fire-and-forget):", err);
  });

  return NextResponse.json({ runId: run.id, status: "RUNNING" });
}
