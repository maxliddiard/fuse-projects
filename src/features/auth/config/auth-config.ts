import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

import { UserRepository } from "@/lib/repositories/user-repository";

import { AuthUtils } from "../utils/auth-utils";

export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("invalid_credentials");
        }

        const user = await AuthUtils.authenticateUser(
          credentials.email,
          credentials.password,
        );

        if (!user) {
          throw new Error("invalid_credentials");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 2,
    updateAge: 60 * 5,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.emailVerifiedAt = user.emailVerifiedAt;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub) {
        session.user.id = token.sub;

        const dbUser = await UserRepository.findById(token.sub);
        session.user.emailVerifiedAt = dbUser?.emailVerifiedAt || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export async function getAuthenticatedUser() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !session.user || !(session.user as any).id) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = (session.user as any).id;
  const user = await UserRepository.findById(userId);

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  return {
    user,
    status: 200,
  };
}
