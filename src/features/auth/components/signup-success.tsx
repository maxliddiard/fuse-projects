"use client";

import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignupSuccessProps {
  email: string;
  onNavigateToLogin: () => void;
}

export function SignupSuccess({
  email,
  onNavigateToLogin,
}: SignupSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-muted p-4 text-muted-foreground">
              <MailCheck className="h-12 w-12" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-normal">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive an email shortly at{" "}
                <span className="font-medium text-foreground">{email}</span>{" "}
                to activate your account.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onNavigateToLogin}
            >
              Log in
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive an email? Check your spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
