"use client";

import { PasswordField } from "@/components/form/password-field";
import { Button } from "@/components/ui/button";

import { useResetPasswordForm } from "../hooks/use-reset-password-form";
import { AuthCard } from "./auth-card";

export default function ResetPasswordForm() {
  const { register, handleSubmit, errors, message, onSubmit } =
    useResetPasswordForm();

  return (
    <AuthCard
      title="Reset Password"
      description="Enter a new password to reset your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <PasswordField
          id="password"
          label="New Password"
          register={register}
          error={errors.password?.message}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          register={register}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" className="w-full">
          Set New Password
        </Button>
        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
          >
            {message.text}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
