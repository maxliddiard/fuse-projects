"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { EmailAccountDTO } from "../types";

interface EmailAccountsTableProps {
  accounts: EmailAccountDTO[];
  loading: boolean;
  disconnecting: string | null;
  onDisconnect: (account: EmailAccountDTO) => void;
}

export function EmailAccountsTable({
  accounts,
  loading,
  disconnecting,
  onDisconnect,
}: EmailAccountsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No email accounts connected yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email Address</TableHead>
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
              {account.emailAddress}
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
                onClick={() => onDisconnect(account)}
              >
                {disconnecting === account.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
