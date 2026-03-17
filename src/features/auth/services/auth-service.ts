import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";

import {
  InvalidCredentialsError,
  InvalidTokenError,
  RateLimitError,
  ResourceNotFoundError,
  TokenExpiredError,
  UserAlreadyExistsError,
} from "@/lib/errors";
import { TokenRepository } from "@/lib/repositories/token-repository";
import { UserRepository } from "@/lib/repositories/user-repository";

import type { ChangePasswordData, SignupUserData } from "../types";

export class AuthService {
  static async authenticateUser(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static async signupUser(
    userData: SignupUserData,
  ): Promise<{ message: string; token?: string }> {
    const { email, password } = userData;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await UserRepository.create({
      email,
      password: hashedPassword,
      emailVerifiedAt: null,
    });

    const token = randomBytes(32).toString("hex");
    const expires = addHours(new Date(), 24);

    await TokenRepository.createVerificationToken(email, token, expires);

    return { message: "User created. Please verify your email.", token };
  }

  static async changePassword(data: ChangePasswordData): Promise<void> {
    const { userId, currentPassword, newPassword } = data;

    const userProfile = await UserRepository.findById(userId);
    if (!userProfile?.email) {
      throw new ResourceNotFoundError("User", userId);
    }

    const user = await UserRepository.findByEmail(userProfile.email);
    if (!user || !user.password) {
      throw new ResourceNotFoundError("User", userId);
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsError("Current password is incorrect");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(userId, { password: hashedNewPassword });
  }

  static async resetPasswordByToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const resetToken = await TokenRepository.findPasswordResetToken(token);

    if (!resetToken) {
      throw new InvalidTokenError("password reset token");
    }

    if (resetToken.expiresAt < new Date()) {
      throw new TokenExpiredError("Password reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await UserRepository.findByEmail(resetToken.email);
    if (!user) {
      throw new ResourceNotFoundError("User");
    }

    await UserRepository.update(user.id, { password: hashedPassword });
    await TokenRepository.deletePasswordResetToken(token);
  }

  static async requestPasswordReset(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await UserRepository.findByEmail(email);

    const genericMessage =
      "If an account with this email exists, you'll receive a reset email shortly.";

    if (!user) {
      return { message: genericMessage };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = addHours(new Date(), 1);

    await TokenRepository.upsertPasswordResetToken(email, token, expiresAt);

    return { message: genericMessage, token };
  }

  static async verifyEmailByToken(token: string): Promise<void> {
    const verification = await TokenRepository.findVerificationToken(token);

    if (!verification) {
      throw new InvalidTokenError("verification token");
    }

    if (verification.expires < new Date()) {
      throw new TokenExpiredError("Verification token");
    }

    await UserRepository.verifyEmail(verification.identifier);
    await TokenRepository.deleteVerificationToken(token);
  }

  static async resendVerificationEmail(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await UserRepository.findByEmail(email);

    if (!user || user.emailVerifiedAt) {
      throw new ResourceNotFoundError("User");
    }

    const existingToken =
      await TokenRepository.findVerificationTokenByIdentifier(email);

    const RESEND_LIMIT_SECONDS = 60;

    if (existingToken) {
      const secondsSinceLast = Math.floor(
        (new Date().getTime() - existingToken.createdAt.getTime()) / 1000,
      );

      if (secondsSinceLast < RESEND_LIMIT_SECONDS) {
        throw new RateLimitError(
          `Please wait ${RESEND_LIMIT_SECONDS - secondsSinceLast} seconds before trying again.`,
          RESEND_LIMIT_SECONDS - secondsSinceLast,
        );
      }

      await TokenRepository.deleteVerificationTokensByIdentifier(email);
    }

    const token = randomBytes(32).toString("hex");
    const expires = addHours(new Date(), 24);

    await TokenRepository.createVerificationToken(email, token, expires);

    return { message: "Verification email resent", token };
  }
}
