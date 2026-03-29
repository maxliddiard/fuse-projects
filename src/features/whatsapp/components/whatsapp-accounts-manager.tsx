"use client";

import { Smartphone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";

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
import { CategorizationPromptEditor } from "@/components/ui/categorization-prompt-editor";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SyncDaysPicker } from "@/components/ui/sync-days-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT } from "@/features/pipeline/constants";

import { useWhatsAppAccounts } from "../hooks/use-whatsapp-accounts";
import {
  disconnectWhatsAppAccount,
  getHistoryStatus,
  startHistoryImport,
  stopHistoryImport,
  updateWhatsAppAccountPrompt,
  type HistorySessionStatus,
  type WhatsAppAccountDTO,
} from "../services/whatsapp-settings-client-service";

function HistoryImportStep({ onComplete }: { onComplete: () => void }) {
  const [sessionAccountId, setSessionAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<HistorySessionStatus | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!status?.qrCode) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(status.qrCode, { width: 256, margin: 2 }).then(setQrDataUrl).catch(() => {});
  }, [status?.qrCode]);

  const handleStart = async () => {
    if (sessionAccountId || pollRef.current) return;

    setStarting(true);
    try {
      const { accountId } = await startHistoryImport();
      setSessionAccountId(accountId);
      pollingIdRef.current = accountId;

      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const currentId = pollingIdRef.current;
          if (!currentId) return;

          const s = await getHistoryStatus(currentId);
          setStatus(s);

          if (s.accountId !== currentId) {
            pollingIdRef.current = s.accountId;
            setSessionAccountId(s.accountId);
          }

          if (s.status === "completed") {
            stopPolling();
            await stopHistoryImport(s.accountId);
            toast.success(`History imported: ${s.messagesImported} messages`);
            onComplete();
          } else if (s.status === "failed") {
            stopPolling();
            toast.error(s.error || "History import failed");
          }
        } catch {
          // Ignore transient poll errors
        }
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    stopPolling();
    const currentId = pollingIdRef.current || sessionAccountId;
    if (currentId) {
      await stopHistoryImport(currentId).catch(() => {});
    }
    setSessionAccountId(null);
    pollingIdRef.current = null;
    setStatus(null);
    onComplete();
  };

  if (!sessionAccountId) {
    return (
      <Button onClick={handleStart} disabled={starting}>
        <Smartphone className="mr-2 h-4 w-4" />
        {starting ? "Starting..." : "Import WhatsApp History"}
      </Button>
    );
  }

  if (status?.status === "waiting_qr" && qrDataUrl) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with WhatsApp on your phone
          (Settings &rarr; Linked Devices &rarr; Link a Device).
        </p>
        <div className="inline-block border border-border p-2 bg-white">
          <img src={qrDataUrl} alt="WhatsApp QR Code" width={256} height={256} />
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={handleStop}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (status?.status === "connected" || status?.status === "syncing") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-muted-foreground">
            Syncing messages... {status.messagesImported > 0 && `(${status.messagesImported} imported)`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleStop}>
          Stop import
        </Button>
      </div>
    );
  }

  if (status?.status === "completed") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground">
          History imported: {status.messagesImported} messages synced.
        </p>
      </div>
    );
  }

  if (status?.status === "failed") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          Import failed: {status.error || "Unknown error"}
        </p>
        <Button variant="ghost" size="sm" onClick={() => { setSessionAccountId(null); setStatus(null); }}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <LoadingSpinner size="sm" />
      <p className="text-sm text-muted-foreground">Connecting...</p>
    </div>
  );
}

export function WhatsAppAccountsManager() {
  const { accounts, loading, removeAccount, refetch } = useWhatsAppAccounts();
  const [disconnectTarget, setDisconnectTarget] = useState<WhatsAppAccountDTO | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

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
        <HistoryImportStep onComplete={refetch} />
        <SyncDaysPicker />
      </div>

      {accounts.map((account) => (
        <CategorizationPromptEditor
          key={account.id}
          accountId={account.id}
          currentPrompt={account.categorizationPrompt}
          defaultPrompt={DEFAULT_WHATSAPP_CATEGORIZATION_PROMPT}
          onSave={async (id, p) => {
            await updateWhatsAppAccountPrompt(id, p);
          }}
          label="Customize how AI categorizes your conversations"
        />
      ))}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No WhatsApp accounts connected yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>History</TableHead>
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
                  <Badge
                    variant={account.historySyncStatus === "COMPLETED" ? "default" : "outline"}
                  >
                    {account.historySyncStatus}
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
