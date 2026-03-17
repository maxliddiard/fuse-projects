import { z } from "zod";

export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{12,}$/;

export const passwordSchema = z.string().regex(passwordRegex, {
  message:
    "Password must be at least 12 characters and contain at least one letter, one number, and one special character.",
});

export const signupSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
