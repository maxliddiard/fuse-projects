"use client";

import { PasswordField } from "@/components/form/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { APP_BACKGROUNDS } from "@/hooks/use-background-preference";

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

  const brandPanel = (
    <div className="flex flex-col gap-8">
      <span className="text-2xl font-normal text-foreground">Fuse Projects</span>

      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-normal leading-tight text-muted-foreground">
          <span className="text-foreground font-medium">Try it for free.</span>{" "}
          Turn client emails into branded deliverables in less than{" "}
          <span className="text-foreground font-medium">5 minutes</span>.
        </h1>
        <p className="text text-muted-foreground leading-relaxed">
          Your AI associate reads emails, storylines, creates and formats presentations and models for you.
          Stop spending Sunday nights on deliverables.
        </p>
      </div>
    </div>
  );

  return (
    <AuthCard
      title="Create Your Account"
      description="Sign up to get started."
      leftPanel={brandPanel}
      leftPanelStyle={{ background: APP_BACKGROUNDS.warm }}
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
            <p className="text-sm text-destructive">{errors.email.message}</p>
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
          <p className="text-sm text-destructive">{message}</p>
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
