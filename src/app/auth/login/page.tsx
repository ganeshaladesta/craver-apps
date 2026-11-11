import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSafeNext(raw: string | string[] | undefined): string {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (!val || !val.startsWith("/") || val.startsWith("//")) return "/";
  return val;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNext(params.next);
  const initialError = Array.isArray(params.error)
    ? params.error[0] ?? ""
    : params.error ?? "";
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const userRes = await supabase?.auth.getUser();
    if (userRes?.data.user) {
      redirect(nextPath);
    }
  }

  return (
    <AuthForm
      mode="login"
      configured={configured}
      nextPath={nextPath}
      initialError={initialError}
    />
  );
}

