import { SignInCard2 } from "@/components/auth/SignInCard2";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();
  return <SignInCard2 mode="forgot" configured={configured} />;
}

