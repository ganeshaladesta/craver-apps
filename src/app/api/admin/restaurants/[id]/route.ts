import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recordAuditLog,
  requireAdmin,
  sendUserNotification,
} from "@/lib/supabase/requireAdmin";

const patchRestaurantSchema = z.object({
  status: z.enum(["draft", "pending", "approved", "rejected", "archived"]).optional(),
  rejection_reason: z.string().trim().max(500).nullable().optional(),
  is_verified: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_trending: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.errorResponse;
  const { supabaseAdmin, adminUser } = guard;

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid restaurant ID." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchRestaurantSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payload." },
      { status: 400 }
    );
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, status, created_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const updateFields: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "approved") {
    updateFields.approved_by = adminUser.id;
    updateFields.approved_at = new Date().toISOString();
    updateFields.rejection_reason = null;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("restaurants")
    .update(updateFields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.status === "approved" && existing.status !== "approved") {
    await Promise.all([
      supabaseAdmin
        .from("menu_categories")
        .update({ status: "approved" })
        .eq("restaurant_id", id)
        .eq("status", "pending"),
      supabaseAdmin
        .from("menu_items")
        .update({ status: "approved" })
        .eq("restaurant_id", id)
        .eq("status", "pending"),
    ]);

    await sendUserNotification(
      supabaseAdmin,
      existing.created_by,
      `${existing.name} is now live on CRAVER`,
      "Your restaurant submission passed moderation and is now publicly discoverable.",
      `/restaurants/${existing.slug}`
    );
  } else if (parsed.data.status === "rejected" && existing.status !== "rejected") {
    await sendUserNotification(
      supabaseAdmin,
      existing.created_by,
      `Update needed for ${existing.name}`,
      parsed.data.rejection_reason
        ? `Moderator note: ${parsed.data.rejection_reason}`
        : "Your restaurant submission requires updates before publication.",
      `/contribute?edit=${existing.id}`
    );
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "restaurant.moderated", "restaurant", id, {
    restaurant_name: existing.name,
    changes: parsed.data,
  });

  return NextResponse.json({ restaurant: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.errorResponse;
  const { supabaseAdmin, adminUser } = guard;

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid restaurant ID." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "restaurant.deleted", "restaurant", id, {
    name: existing?.name ?? null,
  });

  return NextResponse.json({ deleted: true });
}
