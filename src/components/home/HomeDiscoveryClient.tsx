"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Cookie,
  Flame,
  IceCreamBowl,
  Pizza,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { SaveToCollectionModal } from "@/components/restaurants/SaveToCollectionModal";
import { cn, CUISINE_CATEGORIES } from "@/lib/utils";
import type { MenuItem, Restaurant } from "@/types/database";

const CATEGORY_ICON_MAP: Record<string, typeof Utensils> = {
  All: Utensils,
  Indonesian: Flame,
  Japanese: Soup,
  Korean: Flame,
  Chinese: Wine,
  Western: UtensilsCrossed,
  Italian: Pizza,
  "Coffee & Tea": Coffee,
  Dessert: IceCreamBowl,
  "Fast Food": Sandwich,
};

interface HomeDiscoveryClientProps {
  configured: boolean;
  restaurants: Restaurant[];
  dishes: MenuItem[];
}

export function HomeDiscoveryClient({
  configured,
  restaurants,
  dishes,
}: HomeDiscoveryClientProps) {
  const { selectedArea } = useCraver();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((rest) => {
      const catMatch =
        activeCategory === "All" ||
        rest.primary_cuisine === activeCategory ||
        rest.cuisines?.includes(activeCategory);

      const areaMatch =
        !selectedArea ||
        selectedArea === "All Jakarta" ||
        rest.district.toLowerCase().includes(selectedArea.toLowerCase());

      return catMatch && areaMatch;
    });
  }, [activeCategory, restaurants, selectedArea]);

  const exploreHref =
    activeCategory === "All"
      ? "/explore"
      : `/explore?category=${encodeURIComponent(activeCategory)}`;

  return (
    <>
      {/* B. EXPLORE CATEGORIES */}
      <section className="border-b border-[#E8E8E8] bg-[#FAFAFA] py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            role="region"
            aria-label="Explore cuisines"
            className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none"
          >
            {CUISINE_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICON_MAP[category] || Cookie;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-150",
                    active
                      ? "border-[#E23744] bg-[#E23744] text-white shadow-xs"
                      : "border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#E23744]/50 hover:bg-[#FFF0F1] hover:text-[#C91D2B]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* C. TRENDING RESTAURANTS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
              {selectedArea !== "All Jakarta" ? `Selected Area · ${selectedArea}` : "Jakarta Highlights"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-3xl">
              Trending Around You
            </h2>
          </div>
          <Link
            href={exploreHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E23744] hover:text-[#C91D2B]"
          >
            <span>Explore all spots</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {!configured ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
            <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
              Connect Supabase to Load Trending Restaurants
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#696969]">
              Your database schema and 10 Jakarta restaurant seeds are ready in{" "}
              <code className="font-mono">supabase/migrations/</code> and{" "}
              <code className="font-mono">supabase/seed.sql</code>. Add your credentials in{" "}
              <code className="font-mono">.env.local</code> to render live restaurants here.
            </p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
            <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
              No matching restaurants in {selectedArea}
            </h3>
            <p className="mt-2 text-sm text-[#696969]">
              Try resetting your cuisine filter or contribute a great local place yourself.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className="rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744]"
              >
                Show All Cuisines
              </button>
              <Link
                href="/contribute"
                className="rounded-lg bg-[#E23744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C91D2B]"
              >
                Add a Restaurant
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.slice(0, 6).map((rest) => (
              <RestaurantCard
                key={rest.id}
                restaurant={rest}
                onSaveToCollection={setModalRestaurant}
              />
            ))}
          </div>
        )}
      </section>

      {/* D. DISCOVER FOOD */}
      <section className="border-y border-[#E8E8E8] bg-[#FAFAFA] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
                Dish-First Discovery
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-3xl">
                What Are You Craving?
              </h2>
            </div>
            <Link
              href="/explore?view=dishes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E23744] hover:text-[#C91D2B]"
            >
              <span>Browse dishes</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {!configured ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-8 text-center text-sm text-[#696969]">
              Signature dishes from Supabase (<code className="font-mono">menu_items</code>) will
              populate automatically once database migrations &amp; seeds are applied.
            </div>
          ) : dishes.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center text-sm text-[#696969]">
              No approved dishes yet. Add menu items to any restaurant to feature cravings here.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.slice(0, 6).map((dish) => (
                <FoodItemCard key={dish.id} dish={dish} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SaveToCollectionModal
        restaurant={modalRestaurant}
        onClose={() => setModalRestaurant(null)}
      />
    </>
  );
}

