import { format } from "date-fns";

import type { EmailMessage } from "../types";

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return format(date, "h:mm a");
  } else if (days < 7) {
    return format(date, "EEE");
  } else if (date.getFullYear() === now.getFullYear()) {
    return format(date, "MMM d");
  } else {
    return format(date, "MMM d, yyyy");
  }
};

export const isUnread = (message: EmailMessage) => {
  return message.mailboxes.some((m) => !m.isSeen);
};

export const isFlagged = (message: EmailMessage) => {
  return message.mailboxes.some((m) => m.isFlagged);
};
