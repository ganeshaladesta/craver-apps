"use client";

import { SignInCard2 } from "@/components/auth/SignInCard2";

interface AuthFormProps {
  mode: "login" | "signup" | "forgot" | "reset";
  configured: boolean;
  nextPath?: string;
  initialError?: string;
}

export function AuthForm({
  mode,
  configured,
  nextPath = "/",
  initialError = "",
}: AuthFormProps) {
  return (
    <SignInCard2
      mode={mode}
      configured={configured}
      nextPath={nextPath}
      initialError={initialError}
    />
  );
}
