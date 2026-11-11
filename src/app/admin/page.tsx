import { redirect } from "next/navigation";
import {
  AdminDashboardClient,
  type AdminOverviewData,
} from "@/components/admin/AdminDashboardClient";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return (
      <AdminDashboardClient
        configured={false}
        serviceRoleConfigured={false}
        accessDenied={false}
        currentAdminId={null}
        initialData={null}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    redirect("/auth/login?next=/admin");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return (
      <AdminDashboardClient
        configured
        serviceRoleConfigured={false}
        accessDenied={false}
        currentAdminId={user.id}
        initialData={null}
      />
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || profile.is_suspended) {
    return (
      <AdminDashboardClient
        configured
        serviceRoleConfigured
        accessDenied
        currentAdminId={user.id}
        initialData={null}
      />
    );
  }

  const [
    restaurantsRes,
    categoriesRes,
    itemsRes,
    updatesRes,
    reviewsRes,
    photosRes,
    reportsRes,
    usersRes,
    logsRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("menu_categories")
      .select("*, restaurant:restaurants(id, slug, name)")
      .order("created_at", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("menu_items")
      .select("*, restaurant:restaurants(id, slug, name)")
      .order("created_at", { ascending: false })
      .limit(120),
    supabaseAdmin
      .from("restaurant_updates")
      .select(
        "*, restaurant:restaurants(id, slug, name), submitter:profiles!restaurant_updates_submitted_by_fkey(id, full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("reviews")
      .select(
        "*, restaurant:restaurants(id, slug, name), profile:profiles(id, full_name, username, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("photos")
      .select(
        "*, restaurant:restaurants(id, slug, name), profile:profiles(id, full_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("audit_logs")
      .select("*, actor:profiles(id, full_name, email)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const initialData: AdminOverviewData = {
    restaurants: (restaurantsRes.data ?? []) as AdminOverviewData["restaurants"],
    menuCategories: (categoriesRes.data ?? []) as AdminOverviewData["menuCategories"],
    menuItems: (itemsRes.data ?? []) as AdminOverviewData["menuItems"],
    updates: (updatesRes.data ?? []) as AdminOverviewData["updates"],
    reviews: (reviewsRes.data ?? []) as AdminOverviewData["reviews"],
    photos: (photosRes.data ?? []) as AdminOverviewData["photos"],
    reports: (reportsRes.data ?? []) as AdminOverviewData["reports"],
    users: (usersRes.data ?? []) as AdminOverviewData["users"],
    auditLogs: (logsRes.data ?? []) as AdminOverviewData["auditLogs"],
  };

  return (
    <AdminDashboardClient
      configured
      serviceRoleConfigured
      accessDenied={false}
      currentAdminId={user.id}
      initialData={initialData}
    />
  );
}

