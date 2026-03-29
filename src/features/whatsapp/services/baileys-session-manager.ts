import path from "path";
import fs from "fs";

import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import prisma from "@/lib/prisma/client";

import { HistorySyncService } from "./history-sync-service";

type SessionStatus = "idle" | "waiting_qr" | "connected" | "syncing" | "completed" | "failed";

interface Session {
  socket: WASocket | null;
  accountId: string;
  status: SessionStatus;
  qrCode: string | null;
  historyService: HistorySyncService;
  syncTimeoutId: ReturnType<typeof setTimeout> | null;
  ownPhone: string | null;
  error: string | null;
}

const SYNC_IDLE_TIMEOUT_MS = 30_000;
const DATA_DIR = path.join(process.cwd(), "data", "baileys-sessions");

class BaileysSessionManagerSingleton {
  private sessions = new Map<string, Session>();
  private idRedirects = new Map<string, string>();

  async startSession(userId: string, accountId?: string): Promise<{ accountId: string; status: SessionStatus }> {
    if (accountId && this.sessions.has(accountId)) {
      const existing = this.sessions.get(accountId)!;
      return { accountId, status: existing.status };
    }

    for (const s of this.sessions.values()) {
      if (s.accountId.startsWith(`pending_${userId}_`)) {
        return { accountId: s.accountId, status: s.status };
      }
    }

    const tempId = accountId || `pending_${userId}_${Date.now()}`;
    const authDir = path.join(DATA_DIR, tempId);
    fs.mkdirSync(authDir, { recursive: true });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { historySyncDays: true },
    });
    const syncDays = user?.historySyncDays ?? 90;
    const historyService = new HistorySyncService(syncDays);

    const session: Session = {
      socket: null,
      accountId: tempId,
      status: "idle",
      qrCode: null,
      historyService,
      syncTimeoutId: null,
      ownPhone: null,
      error: null,
    };

    this.sessions.set(tempId, session);

    const connectSocket = async () => {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        syncFullHistory: true,
      });

      session.socket = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          session.status = "waiting_qr";
          session.qrCode = qr;
        }

        if (connection === "open") {
          session.status = "connected";
          session.qrCode = null;

          const rawJid = sock.user?.id || "";
          session.ownPhone = rawJid.split("@")[0].split(":")[0];
          console.log(`[BaileysSession] Connected as ${rawJid}`);

          let dbAccountId = accountId;
          if (!dbAccountId && !session.accountId.startsWith("pending_") === false) {
            // Only create account if we haven't already re-keyed
          }
          if (session.accountId.startsWith("pending_")) {
            const account = await prisma.whatsAppAccount.upsert({
              where: {
                userId_phoneNumber: {
                  userId,
                  phoneNumber: session.ownPhone!,
                },
              },
              create: {
                userId,
                phoneNumber: session.ownPhone!,
                displayName: null,
                historySyncStatus: "SYNCING",
                status: "ACTIVE",
              },
              update: {
                historySyncStatus: "SYNCING",
              },
            });
            dbAccountId = account.id;

            this.sessions.delete(tempId);
            session.accountId = dbAccountId;
            this.sessions.set(dbAccountId, session);
            this.idRedirects.set(tempId, dbAccountId);
          } else {
            await prisma.whatsAppAccount.update({
              where: { id: session.accountId },
              data: { historySyncStatus: "SYNCING" },
            }).catch(() => {});
          }

          session.status = "syncing";
          this.resetSyncTimeout(session);
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;

          if (statusCode === DisconnectReason.loggedOut) {
            session.status = "failed";
            session.error = "Device was logged out";
          } else if (session.status !== "completed") {
            console.log(`[BaileysSession] Reconnecting after code ${statusCode}...`);
            await connectSocket();
          }
        }
      });

      sock.ev.on("messaging-history.set", async ({
        chats: newChats,
        contacts: newContacts,
        messages: newMessages,
      }) => {
        if (!session.ownPhone || session.accountId.startsWith("pending_")) return;

        this.resetSyncTimeout(session);

        console.log(
          `[BaileysSession] History batch: ${newMessages.length} messages, ${newChats.length} chats, ${newContacts.length} contacts`,
        );

        if (newMessages.length > 0 || newContacts.length > 0) {
          await session.historyService.processHistoryBatch(
            session.accountId,
            session.ownPhone!,
            newMessages,
            newChats,
            newContacts,
          );
        }
      });
    };

    try {
      await connectSocket();
      return { accountId: session.accountId, status: session.status };
    } catch (error) {
      session.status = "failed";
      session.error = error instanceof Error ? error.message : "Connection failed";
      return { accountId: session.accountId, status: "failed" };
    }
  }

  private resetSyncTimeout(session: Session) {
    if (session.syncTimeoutId) {
      clearTimeout(session.syncTimeoutId);
    }

    session.syncTimeoutId = setTimeout(async () => {
      session.status = "completed";
      console.log(
        `[BaileysSession] History sync complete for ${session.accountId}: ${session.historyService.progress} messages`,
      );

      try {
        await prisma.whatsAppAccount.update({
          where: { id: session.accountId },
          data: {
            historySyncStatus: "COMPLETED",
            historySyncedAt: new Date(),
          },
        });
      } catch {
        // Account may have been deleted
      }

      await this.disconnectSession(session.accountId);
    }, SYNC_IDLE_TIMEOUT_MS);
  }

  getSessionStatus(accountId: string): {
    accountId: string;
    status: SessionStatus;
    qrCode: string | null;
    messagesImported: number;
    error: string | null;
  } | null {
    const resolvedId = this.idRedirects.get(accountId) || accountId;
    const session = this.sessions.get(resolvedId);
    if (!session) return null;

    return {
      accountId: session.accountId,
      status: session.status,
      qrCode: session.qrCode,
      messagesImported: session.historyService.progress,
      error: session.error,
    };
  }

  async disconnectSession(accountId: string): Promise<void> {
    const resolvedId = this.idRedirects.get(accountId) || accountId;
    const session = this.sessions.get(resolvedId);
    if (!session) return;

    if (session.syncTimeoutId) {
      clearTimeout(session.syncTimeoutId);
    }

    try {
      session.socket?.end(undefined);
    } catch {
      // Ignore disconnect errors
    }

    this.sessions.delete(resolvedId);
    this.idRedirects.delete(accountId);
  }
}

const globalKey = "__baileysSessionManager";
export const BaileysSessionManager: BaileysSessionManagerSingleton =
  (globalThis as Record<string, unknown>)[globalKey] as BaileysSessionManagerSingleton ||
  ((globalThis as Record<string, unknown>)[globalKey] = new BaileysSessionManagerSingleton());
