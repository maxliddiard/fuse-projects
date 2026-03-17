import { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    authorized({ token }: { token: any; req: NextRequest }) {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!auth/login|auth/signup|auth/unverified|auth/reset-password|api|_next|.*\\..*|favicon.ico|$).*)",
  ],
};
