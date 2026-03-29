export interface EmailAccountDTO {
  id: string;
  emailAddress: string;
  displayName: string | null;
  status: string;
  categorizationPrompt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface Mailbox {
  id: string;
  name: string;
  displayName: string;
  role?: string;
  messagesTotal: number;
  messagesUnread: number;
}

export interface EmailMessage {
  id: string;
  subject?: string;
  snippet?: string;
  fromName?: string;
  fromAddress?: string;
  date?: string;
  hasAttachments: boolean;
  mailboxes: Array<{
    mailbox: {
      role: string;
    };
    isSeen: boolean;
    isFlagged: boolean;
  }>;
}

export interface FullEmailMessage extends EmailMessage {
  body?: {
    text?: string;
    html?: string;
  };
  addresses: Array<{
    type: string;
    address: string;
    name?: string | null;
  }>;
  attachments: Array<{
    id: string;
    filename?: string | null;
    mimeType?: string | null;
    size?: number;
    isInline: boolean;
  }>;
  conversation?: {
    id: string;
    subject?: string | null;
  };
}

export interface ReplyToData {
  to: string;
  subject: string;
  inReplyTo?: string;
}
