import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  NotificationItem,
  Photo,
  Profile,
  Restaurant,
  Review,
} from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return (
      <ProfileClient
        configured={false}
        userEmail={null}
        initialProfile={null}
        initialFavorites={[]}
        initialSubmissions={[]}
        initialReviews={[]}
        initialPhotos={[]}
        initialNotifications={[]}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    redirect("/auth/login?next=/profile");
  }

  const [
    profileRes,
    favoritesRes,
    submissionsRes,
    reviewsRes,
    photosRes,
    notificationsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("favorites")
      .select("restaurant_id, restaurant:restaurants(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("restaurants")
      .select("*")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*, restaurant:restaurants(id, slug, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("photos")
      .select("*, restaurant:restaurants(id, slug, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const savedRestaurants = (favoritesRes.data ?? [])
    .map((row) => row.restaurant as unknown as Restaurant | null)
    .filter((r): r is Restaurant => Boolean(r));

  return (
    <ProfileClient
      configured
      userEmail={user.email ?? null}
      initialProfile={(profileRes.data ?? null) as Profile | null}
      initialFavorites={savedRestaurants}
      initialSubmissions={(submissionsRes.data ?? []) as Restaurant[]}
      initialReviews={(reviewsRes.data ?? []) as Review[]}
      initialPhotos={(photosRes.data ?? []) as Photo[]}
      initialNotifications={(notificationsRes.data ?? []) as NotificationItem[]}
    />
  );
}

