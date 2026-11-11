"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type AuthCardMode = "login" | "signup" | "forgot" | "reset";

interface SignInCard2Props {
  mode: AuthCardMode;
  configured: boolean;
  nextPath?: string;
  initialError?: string;
}

export function SignInCard2({
  mode,
  configured,
  nextPath = "/",
  initialError = "",
}: SignInCard2Props) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { t, refreshSessionData, showToast } = useCraver();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyPendingEmail, setVerifyPendingEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [statusMsg, setStatusMsg] = useState("");
  const alertRef = useRef<HTMLDivElement>(null);

  // Subtle 3D perspective card tilt inspired by @jatin-yadav05/sign-in-card-2
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-240, 240], [4, -4]);
  const rotateY = useTransform(mouseX, [-240, 240], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const focusAlert = () => {
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg("");
    setStatusMsg("");

    if (!configured) {
      setErrorMsg(t.auth.errors.missingCreds);
      focusAlert();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMsg(t.auth.errors.clientInit);
      focusAlert();
      return;
    }

    setOauthBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setOauthBusy(false);
      setErrorMsg(error.message);
      focusAlert();
    }
  };

  const handleResendVerification = async () => {
    if (!verifyPendingEmail || !configured) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setResending(true);
    setErrorMsg("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: verifyPendingEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    setResending(false);

    if (error) {
      setErrorMsg(error.message);
      focusAlert();
    } else {
      setStatusMsg(t.auth.resendSuccess);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (!configured) {
      setErrorMsg(t.auth.errors.missingCreds);
      focusAlert();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMsg(t.auth.errors.clientInit);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !trimmedEmail.includes("@")) {
          setErrorMsg(t.auth.errors.invalidEmail);
          focusAlert();
          return;
        }

        const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo,
        });
        if (error) {
          setErrorMsg(error.message);
          focusAlert();
          return;
        }
        setStatusMsg(t.auth.resetEmailSent.replace("{email}", trimmedEmail));
        return;
      }

      if (mode === "reset") {
        if (password.length < 8) {
          setErrorMsg(t.auth.errors.invalidEmailPassword);
          focusAlert();
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg(t.auth.errors.passwordMismatch);
          focusAlert();
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setErrorMsg(error.message);
          focusAlert();
          return;
        }
        await refreshSessionData();
        showToast(t.common.toasts.passwordUpdated, "success");
        router.push("/");
        router.refresh();
        return;
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail || password.length < 8) {
        setErrorMsg(t.auth.errors.invalidEmailPassword);
        focusAlert();
        return;
      }

      if (mode === "signup") {
        if (fullName.trim().length < 2) {
          setErrorMsg(t.auth.errors.invalidName);
          focusAlert();
          return;
        }
        if (username.trim() && !/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
          setErrorMsg(t.auth.errors.invalidUsername);
          focusAlert();
          return;
        }

        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName.trim() },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          focusAlert();
          return;
        }

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
          setVerifyPendingEmail(trimmedEmail);
          setStatusMsg(t.auth.verifySubtitle.replace("{email}", trimmedEmail));
          return;
        }

        await refreshSessionData();
        showToast(t.common.toasts.welcomeCraver, "success");
        router.push(nextPath);
        router.refresh();
        return;
      }

      // Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        focusAlert();
        return;
      }

      await refreshSessionData();
      showToast(t.common.toasts.signedIn, "success");
      router.push(nextPath);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === "signup"
      ? t.auth.signUpTitle
      : mode === "forgot"
        ? t.auth.forgotTitle
        : mode === "reset"
          ? t.auth.resetTitle
          : t.auth.signInTitle;

  const subtitle =
    mode === "signup"
      ? t.auth.signUpSubtitle
      : mode === "forgot"
        ? t.auth.forgotSubtitle
        : mode === "reset"
          ? t.auth.resetSubtitle
          : t.auth.signInSubtitle;

  return (
    <div className="relative flex min-h-[calc(100dvh-72px)] w-full items-center justify-center overflow-hidden bg-[#1A0C0D] px-4 py-12 text-[#FFF6E9]">
      {/* Subtle studio lighting accents */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-[#E23744]/22 blur-[120px]" />
        <div className="absolute -right-24 bottom-1/4 h-96 w-96 rounded-full bg-[#FFB800]/16 blur-[120px]" />
        <div className="absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FF7043]/15 blur-[100px]" />
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={shouldReduceMotion ? undefined : { perspective: 1200 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <motion.div
          style={shouldReduceMotion ? undefined : { rotateX, rotateY }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#1F1516]/95 p-6 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-8"
        >
          {/* Traveling animated perimeter light beams (inspired by sign-in-card-2) */}
          {!shouldReduceMotion && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <motion.div
                className="absolute top-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-[#FFB800] to-transparent"
                animate={{ left: ["-50%", "120%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute right-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-[#E23744] to-transparent"
                animate={{ top: ["-50%", "120%"] }}
                transition={{ duration: 3.2, delay: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute bottom-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-[#FF7043] to-transparent"
                animate={{ right: ["-50%", "120%"] }}
                transition={{ duration: 3.2, delay: 1.6, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute left-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-[#F7A8C4] to-transparent"
                animate={{ bottom: ["-50%", "120%"] }}
                transition={{ duration: 3.2, delay: 2.4, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}

          <div className="relative z-10">
            <CraverLogo tone="light" />

            <h1
              id="auth-heading"
              className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-[26px]"
            >
              {verifyPendingEmail ? t.auth.verifyTitle : title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#D6CEC6]">
              {verifyPendingEmail
                ? t.auth.verifySubtitle.replace("{email}", verifyPendingEmail)
                : subtitle}
            </p>

            {!configured && (
              <div className="mt-5 rounded-2xl border border-[#FFB800]/35 bg-[#FFB800]/12 p-3.5 text-xs leading-relaxed text-[#FFF6E9]">
                <p className="font-bold text-[#FFB800]">{t.auth.supabaseUnconfiguredTitle}</p>
                <p className="mt-1 text-[#FFF6E9]/85">{t.auth.supabaseUnconfiguredDesc}</p>
              </div>
            )}

            {errorMsg && (
              <div
                ref={alertRef}
                tabIndex={-1}
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#E23744]/50 bg-[#E23744]/15 p-3.5 text-sm text-[#FFF0F1]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB800]" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {statusMsg && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#5B7553] bg-[#5B7553]/25 p-3.5 text-sm text-[#FFF6E9]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB800]" aria-hidden="true" />
                <span>{statusMsg}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {verifyPendingEmail ? (
                <motion.div
                  key="verify-panel"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  className="mt-6 space-y-4"
                >
                  <button
                    type="button"
                    disabled={resending}
                    onClick={() => void handleResendVerification()}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/15 px-4 py-2.5 text-sm font-bold text-[#FFB800] transition hover:bg-[#FFB800] hover:text-[#1C1C1C] disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", resending && "animate-spin")}
                      aria-hidden="true"
                    />
                    <span>{t.auth.resendEmail}</span>
                  </button>

                  <Link
                    href="/auth/login"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>{t.auth.backToSignIn}</span>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key={mode}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  className="mt-6 space-y-4"
                >
                  {/* Google OAuth Button for Login & Signup */}
                  {(mode === "login" || mode === "signup") && (
                    <>
                      <button
                        type="button"
                        disabled={oauthBusy}
                        onClick={() => void handleGoogleOAuth()}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-[#1C1C1C] shadow-xs transition hover:bg-[#FFF6E9] disabled:opacity-60 cursor-pointer"
                      >
                        {oauthBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#E23744]" aria-hidden="true" />
                        ) : (
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                            />
                          </svg>
                        )}
                        <span>{t.auth.continueWithGoogle}</span>
                      </button>

                      <div className="relative flex items-center py-1">
                        <div className="flex-1 border-t border-white/15" />
                        <span className="px-3 text-xs font-medium text-[#D6CEC6]/75">
                          {t.auth.orEmailDivider}
                        </span>
                        <div className="flex-1 border-t border-white/15" />
                      </div>
                    </>
                  )}

                  <form
                    method="post"
                    onSubmit={handleSubmit}
                    aria-labelledby="auth-heading"
                    className="space-y-4"
                  >
                    {mode === "signup" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="auth-full-name" className="text-xs font-semibold text-[#FFF6E9]">
                            {t.auth.fullNameLabel}{" "}
                            <span className="text-[#FFB800]" aria-hidden="true">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <UserIcon className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45" aria-hidden="true" />
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
                              placeholder={t.auth.fullNamePlaceholder}
                              className="min-h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#FFB800] focus:bg-white/12 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="auth-username" className="text-xs font-semibold text-[#FFF6E9]">
                            {t.auth.usernameLabel}
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
                            placeholder={t.auth.usernamePlaceholder}
                            className="min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#FFB800] focus:bg-white/12 focus:outline-none"
                          />
                          <span id="username-help" className="text-xs text-[#D6CEC6]/75">
                            {t.auth.usernameHelp}
                          </span>
                        </div>
                      </>
                    )}

                    {mode !== "reset" && (
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="auth-email" className="text-xs font-semibold text-[#FFF6E9]">
                          {t.auth.emailLabel}{" "}
                          <span className="text-[#FFB800]" aria-hidden="true">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45" aria-hidden="true" />
                          <input
                            id="auth-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            enterKeyHint={mode === "forgot" ? "done" : "next"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.auth.emailPlaceholder}
                            className="min-h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#FFB800] focus:bg-white/12 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {mode !== "forgot" && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="auth-password" className="text-xs font-semibold text-[#FFF6E9]">
                            {mode === "reset" ? t.auth.newPasswordLabel : t.auth.passwordLabel}{" "}
                            <span className="text-[#FFB800]" aria-hidden="true">*</span>
                          </label>
                          <button
                            type="button"
                            aria-pressed={showPassword}
                            aria-label={showPassword ? t.auth.hidePasswordAria : t.auth.showPasswordAria}
                            aria-describedby="toggle-password-warning"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-[#D6CEC6] hover:bg-white/10 hover:text-white cursor-pointer"
                          >
                            {showPassword ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                                {t.auth.hidePassword}
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                {t.auth.showPassword}
                              </>
                            )}
                          </button>
                          <span id="toggle-password-warning" className="visually-hidden">
                            {t.auth.passwordDisplayWarning}
                          </span>
                        </div>

                        <div className="relative flex items-center">
                          <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45" aria-hidden="true" />
                          <input
                            id="auth-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={
                              mode === "signup" || mode === "reset"
                                ? "new-password"
                                : "current-password"
                            }
                            minLength={8}
                            required
                            enterKeyHint={mode === "reset" ? "next" : "done"}
                            aria-describedby="password-constraints"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="min-h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#FFB800] focus:bg-white/12 focus:outline-none"
                          />
                        </div>
                        <span id="password-constraints" className="text-xs text-[#D6CEC6]/75">
                          {t.auth.passwordHelp}
                        </span>
                      </div>
                    )}

                    {mode === "reset" && (
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="auth-password-confirm" className="text-xs font-semibold text-[#FFF6E9]">
                          {t.auth.confirmPasswordLabel}{" "}
                          <span className="text-[#FFB800]" aria-hidden="true">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45" aria-hidden="true" />
                          <input
                            id="auth-password-confirm"
                            name="confirm_password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            enterKeyHint="done"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="min-h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#FFB800] focus:bg-white/12 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {mode === "login" && (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <label className="inline-flex items-center gap-2 text-[#D6CEC6] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 accent-[#FFB800]"
                          />
                          <span>{t.auth.rememberMe}</span>
                        </label>
                        <Link
                          href="/auth/forgot-password"
                          className="font-semibold text-[#FFB800] hover:underline"
                        >
                          {t.auth.forgotLink}
                        </Link>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#C91D2B] disabled:opacity-60 cursor-pointer"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      <span>
                        {mode === "signup"
                          ? t.auth.signUpBtn
                          : mode === "forgot"
                            ? t.auth.sendResetBtn
                            : mode === "reset"
                              ? t.auth.updatePasswordBtn
                              : t.auth.signInBtn}
                      </span>
                      {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer mode switch */}
            {!verifyPendingEmail && (
              <div className="mt-6 border-t border-white/15 pt-5 text-center text-sm text-[#D6CEC6]">
                {mode === "signup" ? (
                  <>
                    {t.auth.haveAccountPrompt}{" "}
                    <Link
                      href={
                        nextPath && nextPath !== "/"
                          ? `/auth/login?next=${encodeURIComponent(nextPath)}`
                          : "/auth/login"
                      }
                      className="font-bold text-[#FFB800] hover:underline"
                    >
                      {t.auth.logInLink}
                    </Link>
                  </>
                ) : mode === "login" ? (
                  <>
                    {t.auth.noAccountPrompt}{" "}
                    <Link
                      href={
                        nextPath && nextPath !== "/"
                          ? `/auth/signup?next=${encodeURIComponent(nextPath)}`
                          : "/auth/signup"
                      }
                      className="font-bold text-[#FFB800] hover:underline"
                    >
                      {t.auth.createAccountLink}
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 font-bold text-[#FFB800] hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.auth.backToSignIn}</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

