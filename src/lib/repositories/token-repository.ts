import prisma from "../prisma/client";

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TokenRepository {
  // Verification Token methods
  static async createVerificationToken(
    identifier: string,
    token: string,
    expires: Date,
  ): Promise<VerificationToken> {
    return prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });
  }

  static async findVerificationToken(
    token: string,
  ): Promise<VerificationToken | null> {
    return prisma.verificationToken.findUnique({
      where: { token },
    });
  }

  static async findVerificationTokenByIdentifier(
    identifier: string,
  ): Promise<VerificationToken | null> {
    return prisma.verificationToken.findFirst({
      where: { identifier },
    });
  }

  static async deleteVerificationToken(token: string): Promise<void> {
    await prisma.verificationToken.delete({
      where: { token },
    });
  }

  static async deleteVerificationTokensByIdentifier(
    identifier: string,
  ): Promise<void> {
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });
  }

  // Password Reset Token methods
  static async createPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });
  }

  static async findPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: { token },
    });
  }

  static async upsertPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });
  }

  static async deletePasswordResetToken(token: string): Promise<void> {
    await prisma.passwordResetToken.delete({
      where: { token },
    });
  }
}
