import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NotificationItem, Profile } from "@/types/database";

export interface SessionContext {
  configured: boolean;
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
  favoriteIds: string[];
  notifications: NotificationItem[];
}

export async function getSessionContext(): Promise<SessionContext> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      user: null,
      profile: null,
      favoriteIds: [],
      notifications: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      user: null,
      profile: null,
      favoriteIds: [],
      notifications: [],
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      user: null,
      profile: null,
      favoriteIds: [],
      notifications: [],
    };
  }

  const [profileRes, favoritesRes, notificationsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("favorites")
      .select("restaurant_id")
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    configured: true,
    user: { id: user.id, email: user.email ?? null },
    profile: (profileRes.data ?? null) as Profile | null,
    favoriteIds: (favoritesRes.data ?? []).map((f) => f.restaurant_id),
    notifications: (notificationsRes.data ?? []) as NotificationItem[],
  };
}

