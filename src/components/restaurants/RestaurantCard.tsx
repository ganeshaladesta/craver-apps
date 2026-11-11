"use client";

import Link from "next/link";
import { Bookmark, MapPin, ShieldCheck, Star } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { translateCategory } from "@/lib/i18n/dictionary";
import { cn, formatCompactNumber, formatIdr } from "@/lib/utils";
import type { Restaurant } from "@/types/database";

interface RestaurantCardProps {
  restaurant: Restaurant;
  featuredLayout?: boolean;
  onSaveToCollection?: (restaurant: Restaurant) => void;
}

export function RestaurantCard({
  restaurant,
  featuredLayout = false,
  onSaveToCollection,
}: RestaurantCardProps) {
  const { locale, t, favoriteIds, toggleFavorite } = useCraver();
  const isSaved = favoriteIds.includes(restaurant.id);
  const coverSrc = restaurant.cover_image_url || "/images/rest-indonesian-senopati.jpg";

  const cuisineDisplay = restaurant.cuisines?.length
    ? restaurant.cuisines
        .slice(0, 3)
        .map((c) => translateCategory(c, locale))
        .join(" · ")
    : translateCategory(restaurant.primary_cuisine, locale);

  return (
    <article
      className={cn(
        "group flex overflow-hidden rounded-3xl border border-[#EEEEEE] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#E23744]/35 hover:shadow-md",
        featuredLayout ? "flex-col md:flex-row h-full" : "flex-col"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[#FAFAFA] shrink-0",
          featuredLayout
            ? "aspect-[4/3] w-full md:aspect-auto md:w-[48%]"
            : "aspect-[4/3] w-full"
        )}
      >
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
            <span className="rounded-full bg-[#1C1C1C]/88 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#FFB800] backdrop-blur-xs">
              {t.common.trending}
            </span>
          )}
          {restaurant.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#1C1C1C] shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
              {t.common.verified}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-pressed={isSaved}
          aria-label={
            isSaved
              ? `${t.common.removeSaved}: ${restaurant.name}`
              : `${t.common.savePlace}: ${restaurant.name}`
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite(restaurant.id);
          }}
          className={cn(
            "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border transition shadow-xs cursor-pointer",
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

      <div className={cn("flex flex-1 flex-col", featuredLayout ? "p-5 sm:p-6" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/restaurants/${restaurant.slug}`}
            className={cn(
              "font-display font-extrabold leading-snug text-[#1C1C1C] transition group-hover:text-[#E23744]",
              featuredLayout ? "text-xl sm:text-2xl line-clamp-2" : "text-base line-clamp-1"
            )}
          >
            {restaurant.name}
          </Link>

          <div
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#E23744] px-2.5 py-1 text-xs font-bold text-white"
            aria-label={`${Number(restaurant.rating_avg || 0).toFixed(1)} / 5`}
          >
            <span>
              {restaurant.reviews_count > 0 || Number(restaurant.rating_avg) > 0
                ? Number(restaurant.rating_avg).toFixed(1)
                : t.common.newBadge}
            </span>
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          </div>
        </div>

        <p className="mt-1 text-xs font-semibold text-[#E23744] line-clamp-1">
          {cuisineDisplay}
        </p>

        {featuredLayout && (restaurant.tagline || restaurant.description) && (
          <p className="mt-3 text-sm leading-relaxed text-[#696969] line-clamp-3">
            {restaurant.tagline || restaurant.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#696969]">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E23744]" aria-hidden="true" />
            <span className="truncate">
              {restaurant.district}, {restaurant.city}
            </span>
          </span>
          <span className="shrink-0">
            {formatCompactNumber(restaurant.reviews_count)} {t.common.reviews}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-[#EEEEEE] pt-3 text-xs">
            <div>
              <span className="font-bold text-[#1C1C1C]">
                {formatIdr(restaurant.average_price_idr)}
              </span>
              <span className="text-[#696969]"> {t.common.perPerson}</span>
            </div>

            <div className="flex items-center gap-2.5">
              {onSaveToCollection && (
                <button
                  type="button"
                  onClick={() => onSaveToCollection(restaurant)}
                  className="font-semibold text-[#696969] hover:text-[#E23744] cursor-pointer"
                >
                  {t.common.addList}
                </button>
              )}
              <Link
                href={`/restaurants/${restaurant.slug}`}
                className="font-bold text-[#E23744] hover:text-[#C91D2B]"
              >
                {t.common.viewMenu}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
