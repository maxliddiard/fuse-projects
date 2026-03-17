import bcrypt from "bcryptjs";

import { UserRepository } from "@/lib/repositories/user-repository";

export class AuthUtils {
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
}
