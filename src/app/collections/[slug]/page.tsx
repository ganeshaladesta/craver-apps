import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatIdr } from "@/lib/utils";
import type { Collection, CollectionItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-[#696969]">
        Configure Supabase in <code className="font-mono">.env.local</code> to view collections.
      </div>
    );
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

  const typedCol = collection as Collection;
  const typedItems = (items ?? []) as CollectionItem[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/collections"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#696969] hover:text-[#E23744]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>All Collections</span>
      </Link>

      <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-8">
        <span className="rounded-full bg-[#FFF0F1] px-3 py-1 text-xs font-bold uppercase text-[#C91D2B]">
          {typedCol.is_curated ? "Curated Guide" : "Community Collection"}
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#1C1C1C] sm:text-4xl">
          {typedCol.title}
        </h1>
        {typedCol.description && (
          <p className="mt-2 max-w-2xl text-base text-[#696969]">
            {typedCol.description}
          </p>
        )}
      </div>

      {typedItems.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-10 text-center text-sm text-[#696969]">
          No restaurants added to this collection yet. Browse{" "}
          <Link href="/explore" className="font-semibold text-[#E23744] underline">
            Explore
          </Link>{" "}
          and click &ldquo;+ List&rdquo; on any card.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typedItems.map((entry) => {
            const rest = entry.restaurant;
            if (!rest) return null;
            return (
              <Link
                key={entry.id}
                href={`/restaurants/${rest.slug}`}
                className="group overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#FAFAFA]">
                  <img
                    src={rest.cover_image_url || "/images/rest-indonesian-senopati.jpg"}
                    alt={rest.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold text-[#1C1C1C] group-hover:text-[#E23744]">
                      {rest.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded bg-[#E23744] px-2 py-0.5 text-xs font-bold text-white">
                      {Number(rest.rating_avg).toFixed(1)}
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#696969]">
                    <MapPin className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                    {rest.district} · {rest.primary_cuisine} · {formatIdr(rest.average_price_idr)}
                  </p>
                  {entry.note && (
                    <p className="mt-3 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs italic text-[#1C1C1C]">
                      &ldquo;{entry.note}&rdquo;
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

