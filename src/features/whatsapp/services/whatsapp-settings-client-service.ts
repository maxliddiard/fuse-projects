export interface WhatsAppAccountDTO {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  status: string;
  createdAt: string;
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

export async function completeWhatsAppSignup(params: {
  code: string;
  phoneNumber: string;
  phoneNumberId: string;
  waBusinessAccountId: string;
  displayName?: string;
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
