import type { EmailAccountDTO } from "../types";

export async function fetchEmailAccounts(): Promise<EmailAccountDTO[]> {
  const response = await fetch("/api/email/accounts");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function initiateGmailConnection(): Promise<{ authUrl: string }> {
  const response = await fetch("/api/gmail/auth");
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.details || "Failed to initiate Gmail connection");
  }
  return response.json();
}

export async function disconnectEmailAccount(accountId: string): Promise<void> {
  const response = await fetch(`/api/email/accounts?id=${accountId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to disconnect email account");
  }
}
