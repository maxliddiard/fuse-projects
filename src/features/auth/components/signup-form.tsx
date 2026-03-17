"use client";

import { PasswordField } from "@/components/form/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useSignup } from "../hooks/use-signup";
import { useSignupForm } from "../hooks/use-signup-form";
import { AuthCard } from "./auth-card";
import { SignupSuccess } from "./signup-success";

export default function SignupForm() {
  const { navigateToLogin } = useSignupForm();
  const {
    register,
    handleSubmit,
    errors,
    message,
    status,
    isLoading,
    submittedEmail,
    onSubmit,
  } = useSignup();

  if (status === "success") {
    return (
      <SignupSuccess
        email={submittedEmail}
        onNavigateToLogin={navigateToLogin}
      />
    );
  }

  return (
    <AuthCard
      title="Create Your Account"
      description="Sign up to get started."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <PasswordField
          id="password"
          label="Password"
          register={register}
          error={errors.password?.message}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          register={register}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        {message && status === "error" && (
          <p className="text-sm text-red-500">{message}</p>
        )}

        <div className="text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={navigateToLogin}
            className="underline underline-offset-4"
          >
            Login
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
