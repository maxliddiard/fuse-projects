export interface WhatsAppAccountDTO {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  status: string;
  historySyncStatus: string;
  categorizationPrompt: string | null;
  createdAt: string;
}

export interface HistorySessionStatus {
  accountId: string;
  status: "idle" | "waiting_qr" | "connected" | "syncing" | "completed" | "failed";
  qrCode: string | null;
  messagesImported: number;
  error: string | null;
}

export async function startHistoryImport(): Promise<{ accountId: string; status: string }> {
  const response = await fetch("/api/whatsapp/history/start", { method: "POST" });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to start history import");
  }
  return response.json();
}

export async function getHistoryStatus(accountId: string): Promise<HistorySessionStatus> {
  const response = await fetch(`/api/whatsapp/history/status?accountId=${accountId}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to get history status");
  }
  return response.json();
}

export async function stopHistoryImport(accountId: string): Promise<{ success: boolean; messagesImported: number }> {
  const response = await fetch("/api/whatsapp/history/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to stop history import");
  }
  return response.json();
}

export async function fetchWhatsAppAccounts(): Promise<WhatsAppAccountDTO[]> {
  const response = await fetch("/api/whatsapp/accounts");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getWhatsAppAuthConfig(): Promise<{
  appId: string;
  configId: string;
  permissions: string[];
  state: string;
}> {
  const response = await fetch("/api/whatsapp/auth");
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to get WhatsApp config");
  }
  return response.json();
}

export async function updateWhatsAppAccountPrompt(
  accountId: string,
  categorizationPrompt: string | null,
): Promise<void> {
  const response = await fetch(`/api/whatsapp/accounts/${accountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorizationPrompt }),
  });
  if (!response.ok) {
    throw new Error("Failed to update categorization prompt");
  }
}

export async function completeWhatsAppSignup(params: {
  code: string;
  phoneNumber: string;
  phoneNumberId: string;
  waBusinessAccountId: string;
  displayName?: string;
  categorizationPrompt?: string;
}): Promise<WhatsAppAccountDTO> {
  const response = await fetch("/api/whatsapp/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to connect WhatsApp");
  }
  return response.json();
}

export async function disconnectWhatsAppAccount(accountId: string): Promise<void> {
  const response = await fetch(`/api/whatsapp/accounts?id=${accountId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to disconnect WhatsApp account");
  }
}
