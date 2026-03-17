"use client";

import { format, isToday, isYesterday } from "date-fns";
import {
  MoreVertical,
  Paperclip,
  RefreshCw,
  Star,
} from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { EmailMessage } from "../types";
import { isFlagged, isUnread } from "../utils/message-utils";

interface MessageTableProps {
  messages: EmailMessage[];
  loading: boolean;
  onMessageSelect: (message: EmailMessage) => void;
  onRefresh: () => void;
  selectedMessage?: EmailMessage | null;
}

const formatMessageDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (date.getFullYear() === now.getFullYear()) {
    return format(date, "MMM d");
  } else {
    return format(date, "M/d/yy");
  }
};

export function MessageTable({
  messages,
  loading,
  onMessageSelect,
  onRefresh,
  selectedMessage,
}: MessageTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        No messages in this mailbox
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Table */}
      <div className="border border-border flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6"></TableHead>
                <TableHead className="w-[180px]">From</TableHead>
                <TableHead className="min-w-0">Subject</TableHead>
                <TableHead className="w-6"></TableHead>
                <TableHead className="w-[80px] text-right">Date</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow
                  key={message.id}
                  className={cn(
                    "cursor-pointer hover:bg-card transition-colors duration-200",
                    selectedMessage?.id === message.id && "bg-muted",
                    isUnread(message) && "font-medium",
                  )}
                  onClick={() => onMessageSelect(message)}
                  onMouseEnter={() => setHoveredRow(message.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Star */}
                  <TableCell className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          isFlagged(message)
                            ? "fill-foreground text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      />
                    </Button>
                  </TableCell>

                  {/* From */}
                  <TableCell className="font-medium p-3">
                    <div className="truncate w-[160px]">
                      {message.fromName || message.fromAddress || "Unknown"}
                    </div>
                  </TableCell>

                  {/* Subject */}
                  <TableCell className="p-3 max-w-0">
                    <div className="flex items-center min-w-0 overflow-hidden">
                      <span
                        className={cn(
                          "truncate max-w-[300px]",
                          isUnread(message) ? "font-medium" : "font-normal",
                        )}
                      >
                        {message.subject || "(no subject)"}
                      </span>
                      {message.snippet && (
                        <>
                          <span className="mx-2 text-muted-foreground shrink-0">
                            -
                          </span>
                          <span className="text-muted-foreground text-sm truncate min-w-0 flex-1">
                            {message.snippet}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Attachments */}
                  <TableCell className="p-3">
                    {message.hasAttachments && (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-right text-sm text-muted-foreground p-3">
                    {formatMessageDate(message.date)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-6 w-6 p-0 transition-opacity",
                          hoveredRow === message.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Reply</DropdownMenuItem>
                        <DropdownMenuItem>Forward</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
