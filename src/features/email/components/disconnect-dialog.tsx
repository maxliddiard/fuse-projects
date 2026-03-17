"use client";

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

interface DisconnectDialogProps {
  open: boolean;
  emailAddress: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DisconnectDialog({
  open,
  emailAddress,
  onOpenChange,
  onConfirm,
}: DisconnectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect email account?</AlertDialogTitle>
          <AlertDialogDescription>
            This will disconnect <strong>{emailAddress}</strong> from your
            account. You will no longer be able to send or receive emails from
            this account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
