import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerifiedAt: Date | null;
    } & DefaultSession["user"];
  }
  interface User {
    emailVerifiedAt: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    emailVerifiedAt: Date | null;
  }
}
