import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Supabase environment variables are not configured yet.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, connected: false });
    }
    const { error } = await supabase
      .from("restaurants")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { configured: true, connected: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ configured: true, connected: true });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: err instanceof Error ? err.message : "Connection error",
      },
      { status: 500 }
    );
  }
}

