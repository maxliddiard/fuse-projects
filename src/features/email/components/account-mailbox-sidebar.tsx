"use client";

import {
  Archive,
  ChevronDown,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { Mailbox } from "../types";

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  status: string;
}

interface AccountMailboxSidebarProps {
  accounts: EmailAccount[];
  selectedAccount: EmailAccount | null;
  onAccountSelect: (account: EmailAccount) => void;
  onConnectAccount: () => void;
  mailboxes: Mailbox[];
  selectedMailbox: string;
  onMailboxSelect: (mailbox: string) => void;
  onSyncAccount?: (accountId: string) => void;
}

const getMailboxIcon = (name: string) => {
  switch (name.toUpperCase()) {
    case "INBOX":
      return Inbox;
    case "SENT":
    case "[GMAIL]/SENT MAIL":
      return Send;
    case "STARRED":
    case "[GMAIL]/STARRED":
      return Star;
    case "TRASH":
    case "[GMAIL]/TRASH":
      return Trash2;
    case "ARCHIVE":
    case "[GMAIL]/ALL MAIL":
      return Archive;
    default:
      return Mail;
  }
};

export function AccountMailboxSidebar({
  accounts,
  selectedAccount,
  onAccountSelect,
  onConnectAccount,
  mailboxes,
  selectedMailbox,
  onMailboxSelect,
  onSyncAccount,
}: AccountMailboxSidebarProps) {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Account Selector */}
      <div className="p-4">
        {accounts.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No accounts connected
            </p>
            <Button
              onClick={onConnectAccount}
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Connect Gmail
            </Button>
          </div>
        ) : (
          <DropdownMenu
            open={accountDropdownOpen}
            onOpenChange={setAccountDropdownOpen}
          >
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-between h-auto p-3",
              )}
            >
              <div className="text-left overflow-hidden">
                <div className="font-medium text-sm truncate">
                  {selectedAccount?.displayName ||
                    selectedAccount?.emailAddress ||
                    "Select Account"}
                </div>
                {selectedAccount?.displayName && (
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedAccount.emailAddress}
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64" align="start">
              {accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    onAccountSelect(account);
                    setAccountDropdownOpen(false);
                  }}
                  className="flex flex-col items-start p-3 h-auto"
                >
                  <div className="font-medium text-sm truncate">
                    {account.displayName || account.emailAddress}
                  </div>
                  {account.displayName && (
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {account.emailAddress}
                    </div>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onConnectAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Connect New Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mailboxes */}
      {selectedAccount && (
        <>
          <Separator />
          <div className="px-4 py-2">
            <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.15em]">
              Mailboxes
            </h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 pb-4">
              {mailboxes.map((mailbox) => {
                const Icon = getMailboxIcon(mailbox.name);
                const isSelected = selectedMailbox === mailbox.name;

                return (
                  <Button
                    key={mailbox.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onMailboxSelect(mailbox.name)}
                    className={cn(
                      "w-full justify-between mb-1 h-9 px-3",
                      isSelected && "bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{mailbox.displayName}</span>
                    </div>
                    {mailbox.messagesUnread > 0 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {mailbox.messagesUnread}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <Separator />
          <div className="p-4 space-y-2">
            {onSyncAccount && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2"
                onClick={() => onSyncAccount(selectedAccount.id)}
              >
                <RefreshCw className="h-4 w-4" />
                Sync Messages
              </Button>
            )}
            <Link href="/settings/email">
              <Button variant="ghost" size="sm" className="w-full gap-2">
                Account Settings
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
