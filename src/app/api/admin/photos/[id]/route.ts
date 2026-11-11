import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditLog, requireAdmin } from "@/lib/supabase/requireAdmin";

const patchPhotoSchema = z.object({
  status: z.enum(["approved", "rejected", "flagged", "pending"]),
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
    return NextResponse.json({ error: "Invalid photo ID." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchPhotoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("photos")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "photo.moderated", "photo", id, {
    status: parsed.data.status,
  });

  return NextResponse.json({ photo: updated });
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
    return NextResponse.json({ error: "Invalid photo ID." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("photos")
    .select("storage_path, photo_type")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("photos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing?.storage_path) {
    const bucket = existing.photo_type === "food" ? "food-photos" : "restaurant-photos";
    await supabaseAdmin.storage.from(bucket).remove([existing.storage_path]);
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "photo.deleted", "photo", id);
  return NextResponse.json({ deleted: true });
}
