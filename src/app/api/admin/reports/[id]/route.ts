import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recordAuditLog,
  requireAdmin,
  sendUserNotification,
} from "@/lib/supabase/requireAdmin";

const patchReportSchema = z.object({
  status: z.enum(["open", "resolved", "dismissed"]),
  resolution_note: z.string().trim().max(500).optional(),
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
    return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchReportSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("content_reports")
    .update({
      status: parsed.data.status,
      resolution_note: parsed.data.resolution_note ?? null,
      resolved_by: parsed.data.status === "open" ? null : adminUser.id,
      resolved_at: parsed.data.status === "open" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.status !== "open" && updated.reporter_id) {
    await sendUserNotification(
      supabaseAdmin,
      updated.reporter_id,
      `Content report ${parsed.data.status}`,
      parsed.data.resolution_note ||
        `Moderators reviewed your ${updated.target_type} report (${updated.reason}).`,
      null
    );
  }

  await recordAuditLog(supabaseAdmin, adminUser.id, "report.updated", "content_report", id, {
    status: parsed.data.status,
  });

  return NextResponse.json({ report: updated });
}
