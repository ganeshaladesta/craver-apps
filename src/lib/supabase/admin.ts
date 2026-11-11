import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./config";

export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRoleKey ||
    url.includes("your-project-ref") ||
    serviceRoleKey.includes("your-supabase-service-role-key")
  ) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

