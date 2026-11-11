"use client";

import Link from "next/link";
import { Bookmark, MapPin, ShieldCheck, Star } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { cn, formatCompactNumber, formatIdr } from "@/lib/utils";
import type { Restaurant } from "@/types/database";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSaveToCollection?: (restaurant: Restaurant) => void;
}

export function RestaurantCard({
  restaurant,
  onSaveToCollection,
}: RestaurantCardProps) {
  const { favoriteIds, toggleFavorite } = useCraver();
  const isSaved = favoriteIds.includes(restaurant.id);
  const coverSrc = restaurant.cover_image_url || "/images/rest-indonesian-senopati.jpg";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#d6d6d6] hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAFAFA]">
        <Link href={`/restaurants/${restaurant.slug}`} className="block h-full w-full">
          <img
            src={coverSrc}
            alt={restaurant.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {restaurant.is_trending && (
            <span className="rounded-full bg-[#1C1C1C]/85 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-xs">
              Trending
            </span>
          )}
          {restaurant.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#1C1C1C] shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>

        <button
          type="button"
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${restaurant.name} from saved` : `Save ${restaurant.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite(restaurant.id);
          }}
          className={cn(
            "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border transition shadow-xs",
            isSaved
              ? "border-[#E23744] bg-[#E23744] text-white"
              : "border-white/70 bg-white/95 text-[#1C1C1C] hover:border-[#E23744] hover:text-[#E23744]"
          )}
        >
          <Bookmark
            className={cn("h-4 w-4", isSaved && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/restaurants/${restaurant.slug}`}
            className="font-display text-base font-bold leading-snug text-[#1C1C1C] transition group-hover:text-[#E23744] line-clamp-1"
          >
            {restaurant.name}
          </Link>

          <div
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E23744] px-2 py-0.5 text-xs font-bold text-white"
            aria-label={`Rated ${Number(restaurant.rating_avg || 0).toFixed(1)} out of 5`}
          >
            <span>
              {restaurant.reviews_count > 0 || Number(restaurant.rating_avg) > 0
                ? Number(restaurant.rating_avg).toFixed(1)
                : "New"}
            </span>
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          </div>
        </div>

        <p className="mt-1 text-xs font-medium text-[#696969] line-clamp-1">
          {restaurant.cuisines?.length
            ? restaurant.cuisines.slice(0, 3).join(" · ")
            : restaurant.primary_cuisine}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#696969]">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E23744]" aria-hidden="true" />
            <span className="truncate">
              {restaurant.district}, {restaurant.city}
            </span>
          </span>
          <span className="shrink-0">
            {formatCompactNumber(restaurant.reviews_count)} reviews
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E8E8E8] pt-3 text-xs">
          <div>
            <span className="font-semibold text-[#1C1C1C]">
              {formatIdr(restaurant.average_price_idr)}
            </span>
            <span className="text-[#696969]"> / person</span>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToCollection && (
              <button
                type="button"
                onClick={() => onSaveToCollection(restaurant)}
                className="font-medium text-[#696969] hover:text-[#E23744]"
              >
                + List
              </button>
            )}
            <Link
              href={`/restaurants/${restaurant.slug}`}
              className="font-semibold text-[#E23744] hover:text-[#C91D2B]"
            >
              View menu
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

