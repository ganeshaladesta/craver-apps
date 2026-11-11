import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "./admin";
import { createSupabaseServerClient } from "./server";

export type AdminGuardResult =
  | { ok: false; errorResponse: NextResponse }
  | {
      ok: true;
      supabaseAdmin: SupabaseClient;
      adminUser: { id: string; email: string | null };
    };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabase || !supabaseAdmin) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          error:
            "Supabase credentials or SUPABASE_SERVICE_ROLE_KEY are not configured.",
        },
        { status: 503 }
      ),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || profile.is_suspended) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Administrator permissions required." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    supabaseAdmin,
    adminUser: { id: user.id, email: user.email ?? null },
  };
}

export async function recordAuditLog(
  supabaseAdmin: SupabaseClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

export async function sendUserNotification(
  supabaseAdmin: SupabaseClient,
  userId: string | null | undefined,
  title: string,
  body: string,
  link: string | null = null
) {
  if (!userId) return;
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    body,
    link,
  });
}
