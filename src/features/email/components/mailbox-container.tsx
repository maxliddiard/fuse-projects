"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAccounts } from "../hooks/use-accounts";
import { useMailboxes } from "../hooks/use-mailboxes";
import { useMessageDetails } from "../hooks/use-message-details";
import { useMessages } from "../hooks/use-messages";
import type { EmailMessage, ReplyToData } from "../types";
import { AccountMailboxSidebar } from "./account-mailbox-sidebar";
import { ComposeDialog } from "./compose-dialog";
import { ConversationViewer } from "./conversation-viewer";
import { MessageTable } from "./message-table";

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  status: string;
}

export default function MailboxContainer() {
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(
    null,
  );
  const [selectedMailbox, setSelectedMailbox] = useState<string>("INBOX");
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyToData | undefined>();
  const [viewMode, setViewMode] = useState<"table" | "conversation">("table");

  const {
    accounts,
    loading: accountsLoading,
    initiateGmailOAuth,
  } = useAccounts();
  const { mailboxes, refetch: refetchMailboxes } = useMailboxes(
    selectedAccount?.id || "",
  );
  const {
    messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useMessages(selectedAccount?.id || "", selectedMailbox);
  const {
    fullMessage,
    loading: loadingMessage,
    fetchFullMessage,
  } = useMessageDetails();

  // Auto-select first account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  const handleAccountSelect = (account: EmailAccount) => {
    setSelectedAccount(account);
    setSelectedMailbox("INBOX");
    setSelectedMessage(null);
    setViewMode("table");
  };

  const handleMessageSelect = (message: EmailMessage) => {
    setSelectedMessage(message);
    fetchFullMessage(message.id);
    setViewMode("conversation");
  };

  const handleBackToTable = () => {
    setViewMode("table");
    setSelectedMessage(null);
  };

  const handleCompose = () => {
    setReplyTo(undefined);
    setComposeOpen(true);
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      toast.info("Syncing messages from your email account...");

      const response = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to sync messages");
      }

      const result = await response.json();
      toast.success(`Successfully synced ${result.synced || 0} messages`);

      refetchMailboxes();
      refetchMessages();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sync messages",
      );
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <AccountMailboxSidebar
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountSelect={handleAccountSelect}
          onConnectAccount={initiateGmailOAuth}
          mailboxes={mailboxes}
          selectedMailbox={selectedMailbox}
          onMailboxSelect={setSelectedMailbox}
          onSyncAccount={handleSyncAccount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {selectedAccount ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {mailboxes.find((m) => m.name === selectedMailbox)
                    ?.displayName || selectedMailbox}
                </h2>
                {viewMode === "conversation" && selectedMessage && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    &rsaquo; {selectedMessage.subject || "(no subject)"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewMode === "table" && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                )}

                <Button onClick={handleCompose} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Compose
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
              {viewMode === "table" ? (
                <MessageTable
                  messages={messages.filter(
                    (message) =>
                      !searchQuery ||
                      message.subject
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      message.fromName
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      message.fromAddress
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  )}
                  loading={messagesLoading}
                  onMessageSelect={handleMessageSelect}
                  onRefresh={refetchMessages}
                  selectedMessage={selectedMessage}
                />
              ) : (
                <ConversationViewer
                  selectedMessage={selectedMessage}
                  fullMessage={fullMessage}
                  loadingMessage={loadingMessage}
                  onBack={handleBackToTable}
                  accountId={selectedAccount.id}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
            {accounts.length === 0
              ? "Connect an email account to get started"
              : "Select an account from the sidebar"}
          </div>
        )}

        {selectedAccount && (
          <ComposeDialog
            open={composeOpen}
            onOpenChange={setComposeOpen}
            accountId={selectedAccount.id}
            replyTo={replyTo}
          />
        )}
      </div>
    </div>
  );
}
