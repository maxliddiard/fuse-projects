import { PrismaClient } from "@prisma/client";

declare global {
  var _prisma: PrismaClient | undefined;
  var _prismaReady: boolean | undefined;
}

const prisma =
  globalThis._prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["error"],
  });

if (!globalThis._prismaReady) {
  globalThis._prismaReady = true;
  prisma
    .$queryRawUnsafe("PRAGMA journal_mode = WAL")
    .then(() => prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000"))
    .catch((e: unknown) => {
      console.error("Failed to set SQLite PRAGMAs:", e);
    });
}

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = prisma;
}

export default prisma;
