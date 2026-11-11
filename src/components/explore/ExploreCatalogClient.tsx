"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { SaveToCollectionModal } from "@/components/restaurants/SaveToCollectionModal";
import {
  cn,
  CUISINE_CATEGORIES,
  JAKARTA_AREAS,
} from "@/lib/utils";
import type { MenuItem, Restaurant } from "@/types/database";

interface ExploreCatalogClientProps {
  configured: boolean;
  initialQ: string;
  initialCategory: string;
  initialArea: string;
  initialPriceRange: string;
  initialSort: string;
  initialView: string;
  restaurants: Restaurant[];
  dishes: MenuItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export function ExploreCatalogClient({
  configured,
  initialQ,
  initialCategory,
  initialArea,
  initialPriceRange,
  initialSort,
  initialView,
  restaurants,
  dishes,
  totalCount,
  page,
  totalPages,
}: ExploreCatalogClientProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory || "All");
  const [area, setArea] = useState(initialArea || "All Jakarta");
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sort, setSort] = useState(initialSort || "rating");
  const [view, setView] = useState(initialView || "all");
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);

  const navigateWithFilters = (overrides?: Partial<{
    q: string;
    category: string;
    area: string;
    priceRange: string;
    sort: string;
    view: string;
    page: number;
  }>) => {
    const next = {
      q: overrides?.q ?? q,
      category: overrides?.category ?? category,
      area: overrides?.area ?? area,
      priceRange: overrides?.priceRange ?? priceRange,
      sort: overrides?.sort ?? sort,
      view: overrides?.view ?? view,
      page: overrides?.page ?? 1,
    };

    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.category && next.category !== "All") params.set("category", next.category);
    if (next.area && next.area !== "All Jakarta") params.set("area", next.area);
    if (next.priceRange) params.set("priceRange", next.priceRange);
    if (next.sort && next.sort !== "rating") params.set("sort", next.sort);
    if (next.view && next.view !== "all") params.set("view", next.view);
    if (next.page > 1) params.set("page", String(next.page));

    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[#E8E8E8] pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
            Directory &amp; Dish Search
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            Explore Jakarta Restaurants &amp; Food
          </h1>
          <p className="mt-2 text-sm text-[#696969]">
            {configured
              ? `${totalCount} approved restaurants matching your filters.`
              : "Connect Supabase to query live restaurants and full digital menus."}
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setView("all");
              navigateWithFilters({ view: "all" });
            }}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition",
              view !== "dishes"
                ? "bg-[#1C1C1C] text-white"
                : "border border-[#E8E8E8] bg-white text-[#696969] hover:text-[#1C1C1C]"
            )}
          >
            Restaurants &amp; Dishes
          </button>
          <button
            type="button"
            onClick={() => {
              setView("dishes");
              navigateWithFilters({ view: "dishes" });
            }}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition",
              view === "dishes"
                ? "bg-[#E23744] text-white"
                : "border border-[#E8E8E8] bg-white text-[#696969] hover:text-[#1C1C1C]"
            )}
          >
            Focus on Dishes
          </button>
        </div>
      </div>

      {/* Filter Bar (<search> + <form>) */}
      <search className="mt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateWithFilters({ page: 1 });
          }}
          action="/explore"
          method="GET"
          className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 sm:grid-cols-2 lg:grid-cols-12"
        >
          <div className="lg:col-span-4">
            <label htmlFor="explore-q" className="block text-xs font-semibold text-[#1C1C1C]">
              Search keyword
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3">
              <Search className="h-4 w-4 text-[#696969]" aria-hidden="true" />
              <input
                id="explore-q"
                name="q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Restaurant, dish, or vibe..."
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="min-h-11 w-full bg-transparent px-2 text-sm text-[#1C1C1C] focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="explore-category"
              className="block text-xs font-semibold text-[#1C1C1C]"
            >
              Cuisine
            </label>
            <select
              id="explore-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#1C1C1C]"
            >
              {CUISINE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="explore-area" className="block text-xs font-semibold text-[#1C1C1C]">
              Area
            </label>
            <select
              id="explore-area"
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#1C1C1C]"
            >
              {JAKARTA_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="explore-price" className="block text-xs font-semibold text-[#1C1C1C]">
              Price Tier
            </label>
            <select
              id="explore-price"
              name="priceRange"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#1C1C1C]"
            >
              <option value="">Any Budget</option>
              <option value="$">$ (&lt; Rp 120k)</option>
              <option value="$$">$$ (Rp 120k - 220k)</option>
              <option value="$$$">$$$ (Rp 220k - 350k)</option>
              <option value="$$$$">$$$$ (Rp 350k+)</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="explore-sort" className="block text-xs font-semibold text-[#1C1C1C]">
                Sort
              </label>
              <select
                id="explore-sort"
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#1C1C1C]"
              >
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B]"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Apply</span>
            </button>
          </div>
        </form>
      </search>

      {/* Matching Dishes Section */}
      {configured && dishes.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
            Matching Signature Dishes
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <FoodItemCard key={dish.id} dish={dish} />
            ))}
          </div>
        </section>
      )}

      {/* Restaurant Results */}
      {view !== "dishes" && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
              Restaurants {initialQ ? `matching "${initialQ}"` : ""}
            </h2>
            {(initialQ || initialCategory !== "All" || initialArea !== "All Jakarta" || initialPriceRange) && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setCategory("All");
                  setArea("All Jakarta");
                  setPriceRange("");
                  setSort("rating");
                  router.push("/explore");
                }}
                className="text-xs font-semibold text-[#E23744] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {!configured ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-12 text-center text-sm text-[#696969]">
              Configure Supabase credentials in <code className="font-mono">.env.local</code>{" "}
              and run <code className="font-mono">supabase/seed.sql</code> to search the Jakarta
              restaurant catalog.
            </div>
          ) : restaurants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-12 text-center">
              <p className="font-display text-lg font-bold text-[#1C1C1C]">
                No restaurants matched these filters
              </p>
              <p className="mt-1 text-sm text-[#696969]">
                Broaden your Jakarta neighborhood or add this place to CRAVER.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((rest) => (
                  <RestaurantCard
                    key={rest.id}
                    restaurant={rest}
                    onSaveToCollection={setModalRestaurant}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => navigateWithFilters({ page: page - 1 })}
                    className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm font-medium text-[#1C1C1C] hover:border-[#E23744] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm text-[#696969]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => navigateWithFilters({ page: page + 1 })}
                    className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm font-medium text-[#1C1C1C] hover:border-[#E23744] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <SaveToCollectionModal
        restaurant={modalRestaurant}
        onClose={() => setModalRestaurant(null)}
      />
    </div>
  );
}
