"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { translateCategory } from "@/lib/i18n/dictionary";
import { formatIdr } from "@/lib/utils";
import type { Collection, CollectionItem } from "@/types/database";

interface CollectionDetailClientProps {
  configured: boolean;
  collection: Collection | null;
  items: CollectionItem[];
}

export function CollectionDetailClient({
  configured,
  collection,
  items,
}: CollectionDetailClientProps) {
  const { locale, t } = useCraver();

  if (!configured || !collection) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FFF6E9] p-10">
          <h1 className="font-display text-2xl font-bold text-[#1C1C1C]">
            {t.common.connectSupabaseTitle}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{t.collections.connectNotice}</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            {t.collections.allCollectionsBack}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#696969] hover:text-[#E23744]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t.collections.allCollectionsBack}</span>
          </Link>

          <div className="mt-5 rounded-3xl border border-[#EEEEEE] bg-white p-8 shadow-sm">
            <span className="rounded-full bg-[#FFF0F1] px-3 py-1 text-xs font-bold uppercase text-[#C91D2B]">
              {collection.is_curated
                ? t.collections.curatedGuide
                : t.collections.communityCollection}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-[#1C1C1C] sm:text-4xl">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="mt-2 max-w-2xl text-base text-[#696969]">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
            {t.collections.emptyCollection}{" "}
            {t.collections.emptyBrowsePrefix}{" "}
            <Link href="/explore" className="font-semibold text-[#E23744] underline">
              {t.nav.explore}
            </Link>{" "}
            {t.collections.emptyBrowseSuffix}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((entry) => {
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
                      {rest.district} · {translateCategory(rest.primary_cuisine, locale)} ·{" "}
                      {formatIdr(rest.average_price_idr)}
                    </p>
                    {entry.note && (
                      <p className="mt-3 rounded-lg bg-[#FFF6E9] px-3 py-2 text-xs italic text-[#1C1C1C]">
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
    </div>
  );
}

