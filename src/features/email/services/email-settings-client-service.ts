import type { EmailAccountDTO } from "../types";

export async function fetchEmailAccounts(): Promise<EmailAccountDTO[]> {
  const response = await fetch("/api/email/accounts");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function initiateGmailConnection(returnTo?: string): Promise<{ authUrl: string }> {
  const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
  const response = await fetch(`/api/gmail/auth${params}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.details || "Failed to initiate Gmail connection");
  }
  return response.json();
}

export async function setupEmailAccount(
  accountId: string,
  categorizationPrompt?: string,
): Promise<void> {
  const response = await fetch(`/api/email/accounts/${accountId}/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorizationPrompt }),
  });
  if (!response.ok) {
    throw new Error("Failed to set up email account");
  }
}

export async function updateEmailAccountPrompt(
  accountId: string,
  categorizationPrompt: string | null,
): Promise<void> {
  const response = await fetch(`/api/email/accounts/${accountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorizationPrompt }),
  });
  if (!response.ok) {
    throw new Error("Failed to update categorization prompt");
  }
}

export async function disconnectEmailAccount(accountId: string): Promise<void> {
  const response = await fetch(`/api/email/accounts?id=${accountId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to disconnect email account");
  }
}
