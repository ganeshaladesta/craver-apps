import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recordAuditLog,
  requireAdmin,
  sendUserNotification,
} from "@/lib/supabase/requireAdmin";

const patchUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  review_notes: z.string().trim().max(500).optional(),
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
    return NextResponse.json({ error: "Invalid update ID." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("restaurant_updates")
    .update({
      status: parsed.data.status,
      review_notes: parsed.data.review_notes ?? null,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, restaurant:restaurants(id, slug, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const record = updated as {
    title: string;
    submitted_by: string | null;
    restaurant?: { slug?: string; name?: string };
  };

  await sendUserNotification(
    supabaseAdmin,
    record.submitted_by,
    `Restaurant update ${parsed.data.status}`,
    `Your update "${record.title}" for ${record.restaurant?.name || "restaurant"} was ${parsed.data.status}.`,
    record.restaurant?.slug ? `/restaurants/${record.restaurant.slug}?tab=updates` : null
  );

  await recordAuditLog(supabaseAdmin, adminUser.id, "update.moderated", "restaurant_update", id, {
    status: parsed.data.status,
  });

  return NextResponse.json({ update: updated });
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
    return NextResponse.json({ error: "Invalid update ID." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("restaurant_updates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "update.deleted", "restaurant_update", id);
  return NextResponse.json({ deleted: true });
}
