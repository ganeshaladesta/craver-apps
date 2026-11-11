import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.errorResponse;
  const { supabaseAdmin } = guard;

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

  return NextResponse.json({
    restaurants: restaurantsRes.data ?? [],
    menuCategories: categoriesRes.data ?? [],
    menuItems: itemsRes.data ?? [],
    updates: updatesRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    photos: photosRes.data ?? [],
    reports: reportsRes.data ?? [],
    users: usersRes.data ?? [],
    auditLogs: logsRes.data ?? [],
  });
}
