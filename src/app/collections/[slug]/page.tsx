import { notFound } from "next/navigation";
import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Collection, CollectionItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    return <CollectionDetailClient configured={false} collection={null} items={[]} />;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: collection } = await supabase
    .from("collections")
    .select("*, profile:profiles(id, full_name, username, avatar_url)")
    .eq("slug", slug)
    .maybeSingle();

  if (!collection) notFound();

  const { data: items } = await supabase
    .from("collection_items")
    .select("*, restaurant:restaurants(*)")
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  return (
    <CollectionDetailClient
      configured
      collection={collection as Collection}
      items={(items ?? []) as CollectionItem[]}
    />
  );
}
