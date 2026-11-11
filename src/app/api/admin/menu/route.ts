import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recordAuditLog,
  requireAdmin,
  sendUserNotification,
} from "@/lib/supabase/requireAdmin";

const patchMenuSchema = z.object({
  kind: z.enum(["category", "item"]),
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "pending"]).optional(),
  is_popular: z.boolean().optional(),
  is_featured_dish: z.boolean().optional(),
});

const deleteMenuSchema = z.object({
  kind: z.enum(["category", "item"]),
  id: z.string().uuid(),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.errorResponse;
  const { supabaseAdmin, adminUser } = guard;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchMenuSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payload." },
      { status: 400 }
    );
  }

  const table = parsed.data.kind === "category" ? "menu_categories" : "menu_items";
  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updatePayload.status = parsed.data.status;
  if (parsed.data.kind === "item") {
    if (parsed.data.is_popular !== undefined) {
      updatePayload.is_popular = parsed.data.is_popular;
    }
    if (parsed.data.is_featured_dish !== undefined) {
      updatePayload.is_featured_dish = parsed.data.is_featured_dish;
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from(table)
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .select("*, restaurant:restaurants(id, slug, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const record = updated as {
    name?: string;
    created_by?: string | null;
    restaurant?: { slug?: string; name?: string };
  };

  if (parsed.data.status && record.created_by) {
    await sendUserNotification(
      supabaseAdmin,
      record.created_by,
      `Menu ${parsed.data.kind} ${parsed.data.status}`,
      `${record.name || "Menu submission"} for ${record.restaurant?.name || "restaurant"} was ${parsed.data.status}.`,
      record.restaurant?.slug ? `/restaurants/${record.restaurant.slug}?tab=menu` : null
    );
  }

  await recordAuditLog(
    supabaseAdmin,
    adminUser.id,
    `menu.${parsed.data.kind}.moderated`,
    table,
    parsed.data.id,
    updatePayload
  );

  return NextResponse.json({ record: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.errorResponse;
  const { supabaseAdmin, adminUser } = guard;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = deleteMenuSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const table = parsed.data.kind === "category" ? "menu_categories" : "menu_items";
  const { error } = await supabaseAdmin.from(table).delete().eq("id", parsed.data.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog(
    supabaseAdmin,
    adminUser.id,
    `menu.${parsed.data.kind}.deleted`,
    table,
    parsed.data.id
  );

  return NextResponse.json({ deleted: true });
}
