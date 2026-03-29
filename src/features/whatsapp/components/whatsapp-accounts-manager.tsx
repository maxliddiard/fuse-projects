"use client";

import { MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useConnectWhatsApp } from "../hooks/use-connect-whatsapp";
import { useWhatsAppAccounts } from "../hooks/use-whatsapp-accounts";
import { disconnectWhatsAppAccount, type WhatsAppAccountDTO } from "../services/whatsapp-settings-client-service";

export function WhatsAppAccountsManager() {
  const { accounts, loading, removeAccount, refetch } = useWhatsAppAccounts();
  const { connect, connecting } = useConnectWhatsApp();
  const [disconnectTarget, setDisconnectTarget] = useState<WhatsAppAccountDTO | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleConnect = () => {
    connect().then((account) => {
      if (account) {
        toast.success("WhatsApp Business account connected successfully.");
        refetch();
      }
    });
  };

  const handleDisconnect = () => {
    if (!disconnectTarget) return;
    setDisconnecting(disconnectTarget.id);
    disconnectWhatsAppAccount(disconnectTarget.id)
      .then(() => {
        removeAccount(disconnectTarget.id);
        toast.success(`${disconnectTarget.phoneNumber} has been disconnected.`);
      })
      .catch(() => {
        toast.error("Failed to disconnect the WhatsApp account.");
      })
      .finally(() => {
        setDisconnecting(null);
        setDisconnectTarget(null);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={handleConnect} disabled={connecting}>
          <MessageCircle className="mr-2 h-4 w-4" />
          {connecting ? "Connecting..." : "Connect WhatsApp"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}{" "}
          connected
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No WhatsApp accounts connected yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Connected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  {account.phoneNumber}
                </TableCell>
                <TableCell>{account.displayName || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={account.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(account.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disconnecting === account.id}
                    onClick={() => setDisconnectTarget(account)}
                  >
                    {disconnecting === account.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WhatsApp account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect{" "}
              <strong>{disconnectTarget?.phoneNumber}</strong> from your
              account. You will no longer receive WhatsApp messages from this
              number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
