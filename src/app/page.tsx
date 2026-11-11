import Link from "next/link";
import {
  ArrowRight,
  Camera,
  MapPin,
  MessageSquarePlus,
  PlusCircle,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeDiscoveryClient } from "@/components/home/HomeDiscoveryClient";
import { getHomeDiscoveryData } from "@/lib/queries/restaurants";
import { formatIdr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const {
    configured,
    trendingRestaurants,
    featuredRestaurants,
    featuredDishes,
    curatedCollections,
  } = await getHomeDiscoveryData();

  return (
    <div className="bg-white">
      {/* A. HERO SECTION */}
      <HeroSection />

      {/* B. EXPLORE CATEGORIES, C. TRENDING RESTAURANTS, D. DISCOVER FOOD */}
      <HomeDiscoveryClient
        configured={configured}
        restaurants={trendingRestaurants}
        dishes={featuredDishes}
      />

      {/* E. FEATURED RESTAURANTS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
              Editorial Selection
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-3xl">
              Featured Jakarta Restaurants
            </h2>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E23744] hover:text-[#C91D2B]"
          >
            <span>View curated collections</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {!configured ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
            Featured editorial restaurant spotlights will appear here once Supabase seeds are
            applied.
          </div>
        ) : featuredRestaurants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
            No restaurants marked as featured yet. Admins can toggle{" "}
            <code className="font-mono">Featured</code> in the Moderation Dashboard.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lead large editorial spotlight */}
            {featuredRestaurants[0] && (
              <article className="group relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#1C1C1C] lg:col-span-7">
                <img
                  src={
                    featuredRestaurants[0].cover_image_url ||
                    "/images/rest-indonesian-senopati.jpg"
                  }
                  alt={featuredRestaurants[0].name}
                  className="h-full min-h-[340px] w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#E23744] px-3 py-1 text-white">
                      Editor&apos;s Pick
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-xs">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {featuredRestaurants[0].district}, {featuredRestaurants[0].city}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-xs">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      {Number(featuredRestaurants[0].rating_avg).toFixed(1)}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
                    {featuredRestaurants[0].name}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 line-clamp-2">
                    {featuredRestaurants[0].description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/restaurants/${featuredRestaurants[0].slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#E23744] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
                    >
                      <span>Explore Restaurant</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <span className="text-xs text-white/80">
                      Avg. {formatIdr(featuredRestaurants[0].average_price_idr)} / person
                    </span>
                  </div>
                </div>
              </article>
            )}

            {/* Supporting editorial cards */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              {featuredRestaurants.slice(1, 4).map((rest) => (
                <article
                  key={rest.id}
                  className="group flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white sm:flex-row"
                >
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#FAFAFA] sm:aspect-auto sm:w-44">
                    <img
                      src={rest.cover_image_url || "/images/rest-japanese-scbd.jpg"}
                      alt={rest.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#696969]">
                        <span className="font-semibold text-[#E23744]">
                          {rest.primary_cuisine} · {rest.district}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#1C1C1C]">
                          <Star className="h-3.5 w-3.5 fill-[#E23744] text-[#E23744]" aria-hidden="true" />
                          {Number(rest.rating_avg).toFixed(1)}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold text-[#1C1C1C] group-hover:text-[#E23744]">
                        {rest.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#696969] line-clamp-2">
                        {rest.tagline || rest.description}
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/restaurants/${rest.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E23744] hover:text-[#C91D2B]"
                      >
                        <span>Explore Restaurant</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Curated Collections Preview Row */}
        {configured && curatedCollections.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {curatedCollections.slice(0, 3).map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#1C1C1C] aspect-[16/10]"
              >
                <img
                  src={col.cover_image_url || "/images/dish-beef-ramen.jpg"}
                  alt={col.title}
                  className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFF0F1]">
                    Curated Guide
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold">{col.title}</h3>
                  <p className="mt-1 text-xs text-white/80 line-clamp-1">
                    {col.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* F. COMMUNITY SECTION */}
      <section className="border-y border-[#E8E8E8] bg-[#FAFAFA] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
              Powered by Diners
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
              Good Food Deserves to Be Shared.
            </h2>
            <p className="mt-3 text-base text-[#696969]">
              Help people discover great places by sharing restaurants, menus, and
              dining experiences.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#E23744]">
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#1C1C1C]">
                1. Add a Restaurant
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#696969]">
                Put a neighborhood favorite, hidden counter, or newly opened Jakarta
                spot on the map with accurate hours and pricing.
              </p>
              <Link
                href="/contribute"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E23744] hover:text-[#C91D2B]"
              >
                Submit a spot <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#E23744]">
                <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#1C1C1C]">
                2. Upload a Menu
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#696969]">
                Catalog full sections from Best Sellers to Beverages with dish names,
                real IDR pricing, and clear photography.
              </p>
              <Link
                href="/contribute?step=3"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E23744] hover:text-[#C91D2B]"
              >
                Catalog dishes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#E23744]">
                <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#1C1C1C]">
                3. Share Your Review
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#696969]">
                Rate dishes honestly, attach real table photos, and help diners decide
                what to order before they arrive.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E23744] hover:text-[#C91D2B]"
              >
                Review a visit <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/contribute"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E23744] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>Contribute to CRAVER</span>
            </Link>
          </div>
        </div>
      </section>

      {/* G. FINAL CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-[#E8E8E8] bg-white p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
              Your Next Favorite Place Is Waiting.
            </h2>
            <p className="mt-3 text-base text-[#696969]">
              Discover new restaurants and share your favorite food experiences with the
              community.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#E23744] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
          >
            <span>Start Exploring</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
