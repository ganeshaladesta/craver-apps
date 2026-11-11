"use client";

import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { formatIdr } from "@/lib/utils";
import type { MenuItem } from "@/types/database";

interface FoodItemCardProps {
  dish: MenuItem;
}

export function FoodItemCard({ dish }: FoodItemCardProps) {
  const { t } = useCraver();
  const restaurant = dish.restaurant;
  const href = restaurant
    ? `/restaurants/${restaurant.slug}?tab=menu`
    : "/explore";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl border border-black/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAFAFA]">
        <img
          src={dish.photo_url || "/images/dish-nasi-goreng.jpg"}
          alt={dish.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {dish.is_popular && (
          <span className="absolute left-3 top-3 rounded-full bg-[#1C1C1C] px-3 py-1 text-[11px] font-bold text-[#FFB800] shadow-xs">
            {t.common.mostCraved}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-extrabold text-[#1C1C1C] transition group-hover:text-[#E23744] line-clamp-1">
            {dish.name}
          </h3>
          {restaurant && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#FFF0F1] px-1.5 py-0.5 text-xs font-bold text-[#E23744]">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              {Number(restaurant.rating_avg || 0).toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs font-medium text-[#696969] line-clamp-1">
          {restaurant ? `${restaurant.name} · ${restaurant.district}` : "Jakarta Signature Dish"}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          <span className="font-extrabold text-[#1C1C1C]">
            {formatIdr(dish.price_idr)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E23744]">
            {t.common.inspectSpot}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
