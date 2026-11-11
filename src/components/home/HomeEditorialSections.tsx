"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Compass,
  MapPin,
  PlusCircle,
  Star,
} from "lucide-react";
import { Programs } from "@/components/framer/FramerImports";
import { useCraver } from "@/components/providers/CraverProviders";
import { formatT, translateCategory } from "@/lib/i18n/dictionary";
import { cn, formatIdr } from "@/lib/utils";
import type { Collection, Restaurant } from "@/types/database";

interface HomeEditorialSectionsProps {
  configured: boolean;
  featuredRestaurants: Restaurant[];
  curatedCollections: Collection[];
}

export function HomeEditorialSections({
  configured,
  featuredRestaurants,
  curatedCollections,
}: HomeEditorialSectionsProps) {
  const { locale, t, setSelectedArea } = useCraver();
  const shouldReduceMotion = useReducedMotion();

  const programItems = t.home.community.programs.map((item) => ({
    title: item.title,
    description: item.description,
    duration: item.duration,
    iconMode: "image" as const,
    icon: "",
    iconImage: { src: item.image },
  }));

  return (
    <>
      {/* SECTION D: EXPLORE BY LOCATION (Olive Green #5B7553 rich neighborhood band) */}
      <section className="bg-[#5B7553] py-16 sm:py-20 text-[#FFF6E9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFB800]">
                {t.home.locations.eyebrow}
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t.home.locations.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#FFF6E9]/90 sm:text-base">
                {t.home.locations.subtitle}
              </p>
            </div>
            <Link
              href="/explore"
              onClick={() => setSelectedArea("All Jakarta")}
              className="inline-flex items-center gap-2 rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-extrabold text-[#1C1C1C] transition hover:bg-[#FFF6E9]"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>{t.home.locations.nearbyCta}</span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.locations.areas.map((spot) => (
              <Link
                key={spot.area}
                href={`/explore?area=${encodeURIComponent(spot.area)}`}
                onClick={() => setSelectedArea(spot.area)}
                className="group relative overflow-hidden rounded-3xl border border-white/15 bg-[#1C1C1C] shadow-md transition duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={spot.image}
                    alt={`${spot.area} — ${spot.tagline}`}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.06]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{ backgroundColor: spot.accent }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                        spot.accent === "#FFB800" || spot.accent === "#F7A8C4"
                          ? "text-[#1C1C1C]"
                          : "text-white"
                      )}
                    >
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {spot.area}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-white/80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FFB800]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-white">
                    {spot.tagline}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/85 line-clamp-2">
                    {spot.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION E: EDITORIAL FEATURE (Magazine-style food spreads + Supabase Spotlight) */}
      <section className="bg-[#FFF6E9] py-16 sm:py-20 text-[#1C1C1C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C91D2B]">
                {t.home.editorial.eyebrow}
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
                {t.home.editorial.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#574F49] sm:text-base">
                {t.home.editorial.subtitle}
              </p>
            </div>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1C1C]/20 bg-white px-4 py-2 text-sm font-bold text-[#1C1C1C] transition hover:border-[#E23744] hover:text-[#E23744]"
            >
              <span>{t.home.editorial.viewCollections}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* 4 Magazine-Style Asymmetric Visual Stories */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
            {t.home.editorial.features.map((feat, idx) => {
              const spanClass =
                idx === 0 || idx === 3 ? "md:col-span-7" : "md:col-span-5";
              const isDarkCard = feat.bg === "#5B7553";
              const cardBgStyle =
                feat.bg === "#FFF6E9" ? "#FFFFFF" : feat.bg;

              return (
                <Link
                  key={feat.title}
                  href={feat.href}
                  style={{ backgroundColor: cardBgStyle }}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-black/10 p-5 sm:p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg",
                    spanClass,
                    isDarkCard ? "text-white" : "text-[#1C1C1C]"
                  )}
                >
                  <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-12">
                    <div className="sm:col-span-7 flex flex-col justify-between">
                      <div>
                        <span
                          className={cn(
                            "inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                            isDarkCard
                              ? "bg-[#FFB800] text-[#1C1C1C]"
                              : "bg-[#1C1C1C] text-white"
                          )}
                        >
                          {feat.tag}
                        </span>
                        <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight">
                          {feat.title}
                        </h3>
                        <p
                          className={cn(
                            "mt-2 text-sm leading-relaxed",
                            isDarkCard ? "text-white/90" : "text-[#3D352E]"
                          )}
                        >
                          {feat.subtitle}
                        </p>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold">
                        <span>{t.home.editorial.readTrail}</span>
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-5 overflow-hidden rounded-2xl border border-black/10 bg-[#1C1C1C]">
                      <img
                        src={feat.image}
                        alt={feat.title}
                        loading="lazy"
                        className="aspect-[4/3] sm:aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Live Featured Restaurants from Supabase (when configured & populated) */}
          {configured && featuredRestaurants.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {featuredRestaurants[0] && (
                <article className="group relative overflow-hidden rounded-3xl border border-black/10 bg-[#1C1C1C] lg:col-span-7">
                  <img
                    src={
                      featuredRestaurants[0].cover_image_url ||
                      "/images/rest-indonesian-senopati.jpg"
                    }
                    alt={featuredRestaurants[0].name}
                    className="h-full min-h-[340px] w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[#E23744] px-3 py-1 text-white">
                        {t.home.editorial.spotPickBadge}
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
                        <span>{t.home.editorial.exploreRestaurant}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <span className="text-xs text-white/80">
                        {t.home.editorial.avgPricePrefix}{" "}
                        {formatIdr(featuredRestaurants[0].average_price_idr)}{" "}
                        {t.common.perPerson}
                      </span>
                    </div>
                  </div>
                </article>
              )}

              <div className="flex flex-col gap-5 lg:col-span-5">
                {featuredRestaurants.slice(1, 4).map((rest) => (
                  <article
                    key={rest.id}
                    className="group flex flex-1 flex-col overflow-hidden rounded-3xl border border-black/10 bg-white sm:flex-row"
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
                          <span className="font-bold text-[#E23744]">
                            {translateCategory(rest.primary_cuisine, locale)} · {rest.district}
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-[#1C1C1C]">
                            <Star
                              className="h-3.5 w-3.5 fill-[#E23744] text-[#E23744]"
                              aria-hidden="true"
                            />
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
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#E23744] hover:text-[#C91D2B]"
                        >
                          <span>{t.home.editorial.exploreRestaurant}</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Curated Collections Row when Supabase configured */}
          {configured && curatedCollections.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {curatedCollections.slice(0, 3).map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-black/10 bg-[#1C1C1C]"
                >
                  <img
                    src={col.cover_image_url || "/images/dish-beef-ramen.jpg"}
                    alt={col.title}
                    className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFB800]">
                      {t.collections.curatedBadge}
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
        </div>
      </section>

      {/* SECTION F: COMMUNITY CONTRIBUTIONS (Charcoal #1C1C1C canvas with Framer Programs) */}
      <section className="bg-[#1C1C1C] py-16 sm:py-20 text-[#FFF6E9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F7A8C4]">
              {t.home.community.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t.home.community.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#D6CEC6] sm:text-base">
              {t.home.community.subtitle}
            </p>
          </div>

          <div className="mt-10">
            <Programs
              programs={programItems}
              layout={{
                maxWidth: 1280,
                desktopColumns: 4,
                tabletColumns: 2,
                mobileColumns: 1,
                gap: 20,
              }}
              spacing={{
                sectionPadding: "0px 0px",
                cardPadding: "24px",
                cardRadius: "20px",
                cardMinHeight: 270,
              }}
              colors={{
                backgroundColor: "transparent",
                cardBackground: "linear-gradient(155deg, #2B2223 0%, #201A1B 100%)",
                cardTitleColor: "#FFFFFF",
                descriptionColor: "#E6DDD6",
                accentColor: "#FFB800",
              }}
              border={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255, 246, 233, 0.14)",
              }}
              hoverBorderColor="rgba(255, 184, 0, 0.55)"
              cardTitleFont={{
                fontFamily: "var(--font-manrope), Manrope, sans-serif",
                fontSize: "19px",
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
              descriptionFont={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: 1.65,
              }}
              durationFont={{
                fontFamily: "var(--font-manrope), Manrope, sans-serif",
                fontSize: "11px",
                fontWeight: 800,
                lineHeight: 1.3,
              }}
              iconStyle={{
                showIcons: true,
                iconSize: 68,
                iconRadius: 16,
                iconBackground: "#1C1C1C",
              }}
              content={{ showDuration: true }}
              hover={{
                enableHover: !shouldReduceMotion,
                enableShimmer: !shouldReduceMotion,
                hoverLift: 6,
                hoverGlow: 20,
                hoverCardBackground:
                  "linear-gradient(155deg, #3A2225 0%, #24191B 100%)",
                hoverGlowColor: "rgba(226, 55, 68, 0.25)",
                hoverShimmerGradient:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 30%, rgba(255,184,0,0.18) 50%, rgba(255,255,255,0.03) 70%, transparent 100%)",
              }}
              entrance={{
                enableEntrance: false,
                entranceDistance: 12,
                entranceDuration: 0.45,
                entranceStagger: 0.05,
              }}
              accessibility={{
                reducedMotion: Boolean(shouldReduceMotion),
              }}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contribute"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E23744] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#C91D2B]"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>{t.home.community.ctaButton}</span>
            </Link>
            <Link
              href="/explore"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/8 px-6 py-3 text-sm font-bold text-white transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              <span>{t.home.community.browseButton}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION G: FINAL CTA (CRAVER Red + Coral vibrant split CTA band) */}
      <section className="bg-gradient-to-br from-[#E23744] via-[#C91D2B] to-[#FF7043] py-16 sm:py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-white/20 bg-black/15 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFB800]">
                {formatT(t.home.finalCta.eyebrow, {})}
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {t.home.finalCta.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#FFF6E9]/90">
                {t.home.finalCta.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FFB800] px-7 py-3 text-sm font-extrabold text-[#1C1C1C] shadow-sm transition hover:bg-[#FFF6E9]"
              >
                <span>{t.home.finalCta.primaryCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contribute"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-white/80 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#1C1C1C]"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>{t.home.finalCta.secondaryCta}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

