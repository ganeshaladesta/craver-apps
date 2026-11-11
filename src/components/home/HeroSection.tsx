"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Compass, MapPin, Search, Sparkles, Utensils } from "lucide-react";
import { SlotTextWith3D } from "@/components/framer/FramerImports";
import { useCraver } from "@/components/providers/CraverProviders";
import { translateAreaLabel } from "@/lib/i18n/dictionary";
import { JAKARTA_AREAS } from "@/lib/utils";

export function HeroSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { locale, t, selectedArea, setSelectedArea } = useCraver();
  const [query, setQuery] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [slotFontSize, setSlotFontSize] = useState(44);

  const rotatingWords = t.hero.rotatingWords;

  // Cycle animated rotating words smoothly unless reduced motion is preferred
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [rotatingWords.length, shouldReduceMotion]);

  // Keep Framer SlotTextWith3D typography balanced across breakpoints
  useEffect(() => {
    const syncSize = () => {
      const w = window.innerWidth;
      if (w < 480) setSlotFontSize(28);
      else if (w < 640) setSlotFontSize(34);
      else if (w < 1024) setSlotFontSize(40);
      else setSlotFontSize(46);
    };
    syncSize();
    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, []);

  const currentWord = rotatingWords[wordIndex % rotatingWords.length] || rotatingWords[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedArea && selectedArea !== "All Jakarta") {
      params.set("area", selectedArea);
    }
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  return (
    <section className="relative -mt-[72px] flex min-h-[100dvh] items-center overflow-hidden bg-[#1A0C0D] pt-[92px] pb-12 text-[#FFF6E9] lg:pt-[104px] lg:pb-16">
      {/* Subtle atmospheric color warmth (editorial studio lighting, no muddy gradients) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 top-12 h-[420px] w-[420px] rounded-full bg-[#C91D2B]/25 blur-[120px]" />
        <div className="absolute -right-24 bottom-8 h-[380px] w-[380px] rounded-full bg-[#FF7043]/18 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[#FFB800]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* LEFT COLUMN: Editorial Headline, 3D Rotating Slot Typography, Discovery Search */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/35 bg-[#FFB800]/12 px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#FFB800]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.hero.eyebrow}</span>
          </div>

          <h1 className="mt-5 font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] text-[#FFFFFF] sm:text-5xl xl:text-[62px]">
            <span className="block">{t.hero.headlineLine1}</span>
            <span className="block text-[#F7A8C4]">{t.hero.headlineLine2}</span>
            <span className="mt-1 block font-editorial italic font-semibold tracking-[-0.02em] text-[#FFB800]">
              {t.hero.headlineLine3}
            </span>
          </h1>

          {/* Mandatory Framer SlotTextWith3D rotating culinary terms */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-display text-base font-semibold text-[#FFF6E9]/80 sm:text-xl">
              {t.hero.dynamicPrefix}
            </span>
            <div className="inline-flex min-w-[190px] items-center">
              <SlotTextWith3D
                key={`${locale}-${currentWord}`}
                text={currentWord}
                triggerMode="On View"
                flipAxis="Vertical (X)"
                cycles={1}
                flipDuration={shouldReduceMotion ? 0.01 : 0.36}
                staggerDelay={shouldReduceMotion ? 0 : 0.025}
                layerDistance={12}
                textColor="#FF7043"
                hoverColor="#FFB800"
                font={{
                  fontFamily: "var(--font-manrope), Manrope, sans-serif",
                  fontSize: slotFontSize,
                  fontWeight: 800,
                  letterSpacing: -1.4,
                  lineHeight: 1.05,
                  textAlign: "left",
                }}
              />
            </div>
          </div>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#E6DDD6] sm:text-lg">
            {t.hero.subtitle}
          </p>

          {/* Prominent Search Module */}
          <search className="mt-7">
            <form
              onSubmit={handleSubmit}
              action="/explore"
              method="GET"
              className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white p-2 text-[#1C1C1C] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] transition focus-within:ring-4 focus-within:ring-[#FFB800]/35 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2 border-b border-[#EEEEEE] px-3 py-2 sm:border-b-0 sm:border-r sm:py-1">
                <MapPin
                  className="h-4 w-4 shrink-0 text-[#E23744]"
                  aria-hidden="true"
                />
                <label htmlFor="hero-area" className="visually-hidden">
                  {t.hero.areaLabel}
                </label>
                <select
                  id="hero-area"
                  name="area"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-transparent pr-2 text-sm font-semibold text-[#1C1C1C] focus:outline-none"
                >
                  {JAKARTA_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {translateAreaLabel(area, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-1 items-center gap-2 px-3 py-1">
                <Search
                  className="h-4 w-4 shrink-0 text-[#696969]"
                  aria-hidden="true"
                />
                <label htmlFor="hero-search" className="visually-hidden">
                  {t.hero.searchLabel}
                </label>
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="min-h-11 w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#696969] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="min-h-12 shrink-0 rounded-xl bg-[#E23744] px-6 text-sm font-bold text-white transition hover:bg-[#C91D2B] cursor-pointer"
              >
                {t.hero.searchCta}
              </button>
            </form>
          </search>

          {/* Popular Suggestions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[#F7A8C4]">
              {t.hero.popularLabel}
            </span>
            {t.hero.popularSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  router.push(`/explore?q=${encodeURIComponent(item)}`)
                }
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-[#FFF6E9] transition hover:border-[#FFB800] hover:bg-[#FFB800] hover:text-[#1C1C1C] cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Asymmetric Multi-Dish Food Editorial Composition */}
        <div className="relative lg:col-span-5">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Primary Lead Editorial Photography Frame */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#FFF6E9]/20 bg-[#261213] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.65)]">
              <img
                src="/images/hero-jakarta-dining.jpg"
                alt={t.hero.featuredCaption}
                className="aspect-[4/4.4] w-full object-cover"
              />
              <div className="border-t border-white/10 bg-[#241012]/95 px-5 py-4 backdrop-blur-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB800]">
                      {t.hero.featuredBadge}
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-white">
                      {t.hero.featuredCaption}
                    </p>
                    <p className="mt-0.5 text-xs text-[#E6DDD6]/85">
                      {t.hero.featuredSub}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E23744] px-2.5 py-1 text-[11px] font-bold text-white">
                    <Compass className="h-3 w-3" aria-hidden="true" />
                    <span>{t.hero.pill1Label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Layered Secondary Accent Dish Crop (desktop/tablet) */}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-0 sm:block">
              <div className="overflow-hidden rounded-2xl border-2 border-[#FFB800] bg-[#1C1C1C] shadow-xl sm:absolute sm:-left-7 sm:top-6 sm:w-36 sm:-rotate-3">
                <img
                  src="/images/dish-beef-ramen.jpg"
                  alt="Signature Jakarta beef ramen bowl"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="bg-[#FFB800] px-2.5 py-1 text-[11px] font-extrabold text-[#1C1C1C] flex items-center gap-1">
                  <Utensils className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t.hero.pill2Label}</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border-2 border-[#F7A8C4] bg-[#1C1C1C] shadow-xl sm:absolute sm:-right-5 sm:bottom-24 sm:w-32 sm:rotate-3">
                <img
                  src="/images/dish-matcha-latte.jpg"
                  alt="Artisanal ceremonial matcha latte in Kemang"
                  className="aspect-square w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
