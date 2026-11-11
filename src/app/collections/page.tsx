import { CollectionsClient } from "@/components/collections/CollectionsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Collection } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const configured = isSupabaseConfigured();
  let curatedCollections: Collection[] = [];
  let userCollections: Collection[] = [];

  if (configured) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: publicCols } = await supabase
        .from("collections")
        .select("*, collection_items(id)")
        .eq("is_public", true)
        .order("is_curated", { ascending: false })
        .order("created_at", { ascending: false });

      curatedCollections = (publicCols ?? []) as Collection[];

      if (user) {
        const { data: ownCols } = await supabase
          .from("collections")
          .select("*, collection_items(id)")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        userCollections = (ownCols ?? []) as Collection[];
      }
    }
  }

  return (
    <CollectionsClient
      configured={configured}
      curatedCollections={curatedCollections}
      initialUserCollections={userCollections}
    />
  );
}

