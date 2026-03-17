import prisma from "../prisma/client";

export interface CreateUserData {
  email: string;
  password: string;
  emailVerifiedAt?: Date | null;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  emailVerifiedAt?: Date | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  emailVerifiedAt: Date | null;
}

export class UserRepository {
  static async findById(id: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async create(userData: CreateUserData) {
    return prisma.user.create({
      data: userData,
    });
  }

  static async update(id: string, userData: UpdateUserData) {
    return prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  static async verifyEmail(email: string) {
    return prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  }

  static async findPasswordById(id: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });
    return user?.password || null;
  }
}
