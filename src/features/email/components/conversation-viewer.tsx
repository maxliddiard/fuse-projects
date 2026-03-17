"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Forward,
  MoreVertical,
  Paperclip,
  Reply,
  ReplyAll,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { EmailMessage, FullEmailMessage } from "../types";
import { InlineReplyComposer } from "./inline-reply-composer";

interface ConversationViewerProps {
  selectedMessage: EmailMessage | null;
  fullMessage: FullEmailMessage | null;
  loadingMessage: boolean;
  onBack: () => void;
  accountId: string;
}

export function ConversationViewer({
  selectedMessage,
  fullMessage,
  loadingMessage,
  onBack,
  accountId,
}: ConversationViewerProps) {
  const [showInlineReply, setShowInlineReply] = useState(false);

  if (!selectedMessage) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        Select a message to view the conversation
      </div>
    );
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) return email[0].toUpperCase();
    return "?";
  };

  const handleReply = () => setShowInlineReply(true);
  const handleReplySent = () => setShowInlineReply(false);
  const handleReplyCancel = () => setShowInlineReply(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate text-zinc-900 dark:text-zinc-50">
            {selectedMessage.subject || "(no subject)"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {fullMessage?.conversation?.id ? "Conversation" : "Single message"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Message content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {loadingMessage ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(
                      selectedMessage.fromName,
                      selectedMessage.fromAddress,
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {selectedMessage.fromName ||
                        selectedMessage.fromAddress ||
                        "Unknown"}
                    </span>
                    {selectedMessage.fromName && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        &lt;{selectedMessage.fromAddress}&gt;
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
                    {fullMessage?.addresses &&
                      fullMessage.addresses.filter((a) => a.type === "TO")
                        .length > 0 && (
                        <div>
                          <span className="font-medium">To:</span>{" "}
                          {fullMessage.addresses
                            .filter((a) => a.type === "TO")
                            .map((a) =>
                              a.name
                                ? `${a.name} <${a.address}>`
                                : a.address,
                            )
                            .join(", ")}
                        </div>
                      )}

                    {fullMessage?.addresses &&
                      fullMessage.addresses.filter((a) => a.type === "CC")
                        .length > 0 && (
                        <div>
                          <span className="font-medium">CC:</span>{" "}
                          {fullMessage.addresses
                            .filter((a) => a.type === "CC")
                            .map((a) =>
                              a.name
                                ? `${a.name} <${a.address}>`
                                : a.address,
                            )
                            .join(", ")}
                        </div>
                      )}

                    <div>
                      {selectedMessage.date &&
                        format(new Date(selectedMessage.date), "PPpp")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleReply}>
                    <Reply className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleReply}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ReplyAll className="h-4 w-4 mr-2" />
                        Reply all
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="h-4 w-4 mr-2" />
                        Forward
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Attachments */}
              {fullMessage?.attachments &&
                fullMessage.attachments.length > 0 && (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="h-4 w-4" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {fullMessage.attachments.length} attachment(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {fullMessage.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 border border-zinc-200 dark:border-zinc-800 rounded-md"
                        >
                          <Paperclip className="h-4 w-4 text-zinc-400" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {attachment.filename || "Unnamed file"}
                            </div>
                            {attachment.size && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {Math.round(attachment.size / 1024)} KB
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <Separator />

              {/* Message body */}
              <div className="prose max-w-none dark:prose-invert">
                {fullMessage?.body ? (
                  fullMessage.body.html ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: fullMessage.body.html,
                      }}
                      className="email-content"
                    />
                  ) : fullMessage.body.text ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {fullMessage.body.text}
                    </pre>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">
                      No content available
                    </p>
                  )
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Loading message content...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply section */}
      {showInlineReply ? (
        <InlineReplyComposer
          originalMessage={selectedMessage}
          accountId={accountId}
          onSend={handleReplySent}
          onCancel={handleReplyCancel}
        />
      ) : (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button onClick={handleReply} className="gap-2">
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            <Button variant="outline" className="gap-2">
              <ReplyAll className="h-4 w-4" />
              Reply all
            </Button>
            <Button variant="outline" className="gap-2">
              <Forward className="h-4 w-4" />
              Forward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
