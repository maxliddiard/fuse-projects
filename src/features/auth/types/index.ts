export interface AuthUser {
  user: {
    id: string;
    email: string | null;
  };
  status: number;
}

export interface AuthUserResponse {
  user?: {
    id: string;
    email: string | null;
  };
  status: number;
  error?: string;
}

export interface SignupUserData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
