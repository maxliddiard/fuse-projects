"use client";

import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useConnectGmail } from "../hooks/use-connect-gmail";
import { useDisconnectAccount } from "../hooks/use-disconnect-account";
import { useEmailAccounts } from "../hooks/use-email-accounts";
import type { EmailAccountDTO } from "../types";
import { DisconnectDialog } from "./disconnect-dialog";
import { EmailAccountsTable } from "./email-accounts-table";

export function EmailAccountsManager() {
  const { accounts, loading, removeAccount, refetch } = useEmailAccounts();
  const { connect, connecting } = useConnectGmail();
  const { disconnect, disconnecting } = useDisconnectAccount();
  const searchParams = useSearchParams();

  const [disconnectTarget, setDisconnectTarget] =
    useState<EmailAccountDTO | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      toast.success("Your Gmail account has been connected successfully.");
      refetch();
    } else if (error) {
      toast.error(`Failed to connect Gmail: ${error.replace(/_/g, " ")}`);
    }
  }, [searchParams, refetch]);

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    const result = await disconnect(disconnectTarget.id);
    if (result.success) {
      removeAccount(disconnectTarget.id);
      toast.success(`${disconnectTarget.emailAddress} has been disconnected.`);
    } else {
      toast.error("Failed to disconnect the email account.");
    }
    setDisconnectTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}{" "}
          connected
        </p>
        <Button onClick={connect} disabled={connecting}>
          <Mail className="mr-2 h-4 w-4" />
          {connecting ? "Connecting..." : "Connect Gmail"}
        </Button>
      </div>

      <EmailAccountsTable
        accounts={accounts}
        loading={loading}
        disconnecting={disconnecting}
        onDisconnect={setDisconnectTarget}
      />

      <DisconnectDialog
        open={!!disconnectTarget}
        emailAddress={disconnectTarget?.emailAddress || ""}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
