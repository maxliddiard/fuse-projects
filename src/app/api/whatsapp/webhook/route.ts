import { NextRequest, NextResponse } from "next/server";

import {
  WhatsAppWebhookService,
  WhatsAppSyncService,
} from "@/features/whatsapp/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const result = WhatsAppWebhookService.verifyWebhook(mode, token, challenge);

  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!WhatsAppWebhookService.validateSignature(rawBody, signature)) {
    console.warn("[WhatsApp Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = WhatsAppWebhookService.parseWebhookPayload(body);

  if (!payload) {
    return NextResponse.json({ received: true });
  }

  // Process asynchronously — return 200 immediately per Meta's requirements
  Promise.allSettled([
    WhatsAppSyncService.processInboundMessages(payload),
    WhatsAppSyncService.processStatusUpdates(payload),
  ]).catch((err) => {
    console.error("[WhatsApp Webhook] Processing error:", err);
  });

  return NextResponse.json({ received: true });
}
