import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditLog, requireAdmin } from "@/lib/supabase/requireAdmin";

const patchReviewSchema = z.object({
  status: z.enum(["published", "flagged", "hidden"]),
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
    return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchReviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("reviews")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "review.moderated", "review", id, {
    status: parsed.data.status,
  });

  return NextResponse.json({ review: updated });
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
    return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "review.deleted", "review", id);
  return NextResponse.json({ deleted: true });
}
