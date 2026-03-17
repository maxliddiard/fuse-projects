declare module "next-auth" {
  interface User {
    id: string;
    emailVerifiedAt?: Date | null;
  }

  interface Session {
    user: User;
  }
}
