import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}

