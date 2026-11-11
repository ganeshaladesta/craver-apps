"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
  configured: boolean;
  nextPath: string;
  initialError?: string;
}

export function AuthForm({
  mode,
  configured,
  nextPath,
  initialError = "",
}: AuthFormProps) {
  const router = useRouter();
  const { refreshSessionData, showToast } = useCraver();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [confirmationMsg, setConfirmationMsg] = useState("");
  const alertRef = useRef<HTMLDivElement>(null);

  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setConfirmationMsg("");

    if (!configured) {
      setErrorMsg(
        "Supabase credentials are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      );
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMsg("Unable to initialize Supabase authentication client.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 8) {
      setErrorMsg("Enter a valid email address and a password of at least 8 characters.");
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    if (isSignup) {
      if (fullName.trim().length < 2) {
        setErrorMsg("Please enter your full name (at least 2 characters).");
        requestAnimationFrame(() => alertRef.current?.focus());
        return;
      }
      if (username.trim() && !/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
        setErrorMsg(
          "Username must be 3–30 characters using only letters, numbers, or underscores."
        );
        requestAnimationFrame(() => alertRef.current?.focus());
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          requestAnimationFrame(() => alertRef.current?.focus());
          return;
        }

        // If user session is immediately active, persist optional custom username
        if (data.session && data.user && username.trim()) {
          await supabase
            .from("profiles")
            .update({
              full_name: fullName.trim(),
              username: username.trim().toLowerCase(),
            })
            .eq("id", data.user.id);
        }

        if (!data.session) {
          setConfirmationMsg(
            `Account created for ${trimmedEmail}. Check your inbox to confirm your email address, then sign in.`
          );
          return;
        }

        await refreshSessionData();
        showToast("Welcome to CRAVER!", "success");
        router.push(nextPath);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          requestAnimationFrame(() => alertRef.current?.focus());
          return;
        }

        await refreshSessionData();
        showToast("Signed in to CRAVER.", "success");
        router.push(nextPath);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-220px)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <CraverLogo />
          <h1
            id="auth-heading"
            className="mt-5 font-display text-2xl font-extrabold tracking-tight text-[#1C1C1C]"
          >
            {isSignup ? "Join the CRAVER community" : "Sign in to CRAVER"}
          </h1>
          <p className="mt-1.5 text-sm text-[#696969]">
            {isSignup
              ? "Save favorite restaurants, upload dishes, and review places around Jakarta."
              : "Access your saved lists, submitted restaurants, and community reviews."}
          </p>
        </div>

        {!configured && (
          <div className="mb-5 rounded-xl border border-[#E23744]/25 bg-[#FFF0F1] p-4 text-xs leading-relaxed text-[#C91D2B]">
            <p className="font-semibold">Supabase Auth not configured yet</p>
            <p className="mt-1">
              Add <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="font-mono font-semibold">.env.local</code> to enable real sign-in.
            </p>
          </div>
        )}

        {errorMsg && (
          <div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#C91D2B]/30 bg-[#FFF0F1] p-3.5 text-sm text-[#C91D2B]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {confirmationMsg && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#1F7A4C]/30 bg-emerald-50 p-3.5 text-sm text-[#1F7A4C]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{confirmationMsg}</span>
          </div>
        )}

        <form
          method="post"
          onSubmit={handleSubmit}
          aria-labelledby="auth-heading"
          className="space-y-4"
        >
          {isSignup && (
            <>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-full-name"
                  className="text-sm font-medium text-[#1C1C1C]"
                >
                  Full name <span className="text-[#E23744]" aria-hidden="true">*</span>
                </label>
                <input
                  id="auth-full-name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rani Kartika"
                  className="min-h-11 rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-[#1C1C1C] placeholder:text-[#696969]/70"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-username"
                  className="text-sm font-medium text-[#1C1C1C]"
                >
                  Username <span className="text-xs font-normal text-[#696969]">(optional)</span>
                </label>
                <input
                  id="auth-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  pattern="[a-zA-Z0-9_]{3,30}"
                  maxLength={30}
                  aria-describedby="username-help"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ranikartika"
                  className="min-h-11 rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-[#1C1C1C] placeholder:text-[#696969]/70"
                />
                <span id="username-help" className="text-xs text-[#696969]">
                  3–30 characters using letters, numbers, and underscores.
                </span>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="auth-email"
              className="text-sm font-medium text-[#1C1C1C]"
            >
              Email address <span className="text-[#E23744]" aria-hidden="true">*</span>
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-11 rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-[#1C1C1C] placeholder:text-[#696969]/70"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-[#1C1C1C]"
              >
                Password <span className="text-[#E23744]" aria-hidden="true">*</span>
              </label>
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-describedby="toggle-password-warning"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Show
                  </>
                )}
              </button>
              <span id="toggle-password-warning" className="visually-hidden">
                Warning: this will display your password on the screen.
              </span>
            </div>

            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              required
              enterKeyHint="done"
              aria-describedby="password-constraints"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-11 rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-[#1C1C1C] placeholder:text-[#696969]/70"
            />
            <span id="password-constraints" className="text-xs text-[#696969]">
              Eight or more characters.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C91D2B] disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSignup ? "Create CRAVER Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#E8E8E8] pt-5 text-center text-sm text-[#696969]">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link
                href={
                  nextPath && nextPath !== "/"
                    ? `/auth/login?next=${encodeURIComponent(nextPath)}`
                    : "/auth/login"
                }
                className="font-semibold text-[#E23744] hover:underline"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New to CRAVER?{" "}
              <Link
                href={
                  nextPath && nextPath !== "/"
                    ? `/auth/signup?next=${encodeURIComponent(nextPath)}`
                    : "/auth/signup"
                }
                className="font-semibold text-[#E23744] hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
