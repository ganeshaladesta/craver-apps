import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditLog, requireAdmin } from "@/lib/supabase/requireAdmin";

const patchUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  is_suspended: z.boolean().optional(),
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
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  if (id === adminUser.id) {
    return NextResponse.json(
      { error: "Cannot change your own administrator role or suspension status." },
      { status: 400 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "user.updated", "profile", id, parsed.data);
  return NextResponse.json({ user: updated });
}
