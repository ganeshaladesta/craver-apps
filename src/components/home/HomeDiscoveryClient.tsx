"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Utensils } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { FoodItemCard } from "@/components/restaurants/FoodItemCard";
import { SaveToCollectionModal } from "@/components/restaurants/SaveToCollectionModal";
import { translateAreaLabel, translateCategory } from "@/lib/i18n/dictionary";
import { cn, CUISINE_CATEGORIES } from "@/lib/utils";
import type { MenuItem, Restaurant } from "@/types/database";

const CATEGORY_VISUALS: Record<string, { image: string; accent: string }> = {
  Indonesian: { image: "/images/dish-nasi-goreng.jpg", accent: "#E23744" },
  Japanese: { image: "/images/dish-beef-ramen.jpg", accent: "#FF7043" },
  Korean: { image: "/images/rest-korean-bbq.jpg", accent: "#C91D2B" },
  Chinese: { image: "/images/rest-chinese-dimsum.jpg", accent: "#FFB800" },
  Western: { image: "/images/rest-western-steak.jpg", accent: "#5B7553" },
  Italian: { image: "/images/dish-pasta-carbonara.jpg", accent: "#FF7043" },
  "Coffee & Tea": { image: "/images/dish-matcha-latte.jpg", accent: "#5B7553" },
  Dessert: { image: "/images/dish-cheesecake.jpg", accent: "#F7A8C4" },
  "Street Food": { image: "/images/dish-chicken-katsu.jpg", accent: "#FFB800" },
  "Fast Food": { image: "/images/dish-gourmet-burger.jpg", accent: "#E23744" },
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
  const { locale, t, selectedArea } = useCraver();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);

  const visibleCategories = useMemo(
    () => CUISINE_CATEGORIES.filter((c) => c !== "All"),
    []
  );

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

  const leadRestaurant = filteredRestaurants[0] ?? null;
  const gridRestaurants = filteredRestaurants.slice(1, 6);

  return (
    <>
      {/* SECTION A: FOOD CATEGORIES (Cream #FFF6E9 editorial strip) */}
      <section className="border-b border-[#EBDCC8] bg-[#FFF6E9] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C91D2B]">
                {t.home.categories.eyebrow}
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
                {t.home.categories.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#574F49] sm:text-base">
                {t.home.categories.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={activeCategory === "All"}
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer",
                  activeCategory === "All"
                    ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#FFF6E9]"
                    : "border-[#1C1C1C]/20 bg-white text-[#1C1C1C] hover:border-[#E23744]"
                )}
              >
                <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{translateCategory("All", locale)}</span>
              </button>
              <Link
                href={exploreHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E23744] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#C91D2B]"
              >
                <span>{t.home.categories.browseAllCta}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div
            role="region"
            aria-label={t.nav.exploreCategories}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:gap-4"
          >
            {visibleCategories.map((category) => {
              const visual = CATEGORY_VISUALS[category] || {
                image: "/images/dish-nasi-goreng.jpg",
                accent: "#E23744",
              };
              const active = activeCategory === category;
              const subtitle = t.home.categories.subtitles[category] || "";

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(active ? "All" : category)}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition duration-200 cursor-pointer",
                    active
                      ? "border-[#E23744] ring-2 ring-[#E23744] shadow-md -translate-y-0.5"
                      : "border-[#E8DCD0] hover:-translate-y-0.5 hover:border-[#E23744]/50 hover:shadow-sm"
                  )}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAFAFA]">
                    <img
                      src={visual.image}
                      alt={translateCategory(category, locale)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                    />
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: visual.accent }}
                      className="absolute left-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <span className="font-display text-sm font-extrabold text-[#1C1C1C] group-hover:text-[#E23744]">
                      {translateCategory(category, locale)}
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#696969] line-clamp-2">
                      {subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION B: TRENDING RESTAURANTS (Crisp White #FFFFFF editorial canvas) */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#E23744]">
                {selectedArea !== "All Jakarta"
                  ? `${t.home.trending.selectedAreaPrefix} ${translateAreaLabel(selectedArea, locale)}`
                  : t.home.trending.eyebrow}
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
                {t.home.trending.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#696969] sm:text-base">
                {t.home.trending.subtitle}
              </p>
            </div>
            <Link
              href={exploreHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EEEEEE] bg-[#FAFAFA] px-4 py-2 text-sm font-bold text-[#E23744] transition hover:border-[#E23744]/40 hover:bg-[#FFF0F1]"
            >
              <span>{t.home.trending.exploreAll}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {!configured ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-[#E8DCD0] bg-[#FFF6E9] p-8 sm:p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E23744] text-white">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-extrabold text-[#1C1C1C]">
                {t.common.connectSupabaseTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#574F49]">
                {t.common.connectSupabaseDesc}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E23744] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C91D2B]"
                >
                  <span>{t.home.trending.exploreAll}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contribute"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1C1C]/20 bg-white px-5 py-2.5 text-sm font-bold text-[#1C1C1C] hover:border-[#E23744]"
                >
                  {t.home.trending.addRestaurant}
                </Link>
              </div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#EEEEEE] bg-[#FAFAFA] p-10 text-center">
              <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
                {t.home.trending.noMatchTitle.replace(
                  "{area}",
                  translateAreaLabel(selectedArea, locale)
                )}
              </h3>
              <p className="mt-2 text-sm text-[#696969]">{t.home.trending.noMatchBody}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCategory("All")}
                  className="rounded-full border border-[#EEEEEE] bg-white px-5 py-2 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744]"
                >
                  {t.home.trending.showAllCuisines}
                </button>
                <Link
                  href="/contribute"
                  className="rounded-full bg-[#E23744] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C91D2B]"
                >
                  {t.home.trending.addRestaurant}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leadRestaurant && (
                <div className="sm:col-span-2 lg:col-span-2">
                  <RestaurantCard
                    restaurant={leadRestaurant}
                    featuredLayout
                    onSaveToCollection={setModalRestaurant}
                  />
                </div>
              )}
              {gridRestaurants.map((rest) => (
                <RestaurantCard
                  key={rest.id}
                  restaurant={rest}
                  onSaveToCollection={setModalRestaurant}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION C: DISCOVER DISHES (Warm Yellow #FFB800 vibrant band) */}
      <section className="border-y border-[#E6A300] bg-[#FFB800] py-16 sm:py-20 text-[#1C1C1C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-[#1C1C1C] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#FFB800]">
                {t.home.dishes.eyebrow}
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
                {t.home.dishes.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#2F2710] sm:text-base">
                {t.home.dishes.subtitle}
              </p>
            </div>
            <Link
              href="/explore?view=dishes"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1C1C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#C91D2B]"
            >
              <span>{t.home.dishes.browseDishes}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {!configured ? (
            <div className="mt-8 rounded-3xl border border-[#1C1C1C]/15 bg-[#FFF6E9] p-8 text-center text-sm text-[#1C1C1C]">
              {t.home.trending.connectBannerNote}
            </div>
          ) : dishes.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#1C1C1C]/15 bg-[#FFF6E9] p-8 text-center text-sm text-[#1C1C1C]">
              {t.home.dishes.noDishes}
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
