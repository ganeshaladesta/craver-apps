"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Sparkles } from "lucide-react";
import { SlotTextWith3D } from "@/components/framer/FramerImports";
import { useCraver } from "@/components/providers/CraverProviders";
import { JAKARTA_AREAS } from "@/lib/utils";

const ROTATING_WORDS = ["Restaurants", "Food", "Experiences", "Flavors"];

const POPULAR_SUGGESTIONS = [
  "Nasi Goreng",
  "Beef Ramen",
  "Matcha Latte",
  "Senopati",
  "Cheesecake",
];

export function HeroSection() {
  const router = useRouter();
  const { selectedArea, setSelectedArea } = useCraver();
  const [query, setQuery] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [slotFontSize, setSlotFontSize] = useState(50);

  // Cycle animated rotating words cleanly
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keep Framer SlotTextWith3D fontSize crisp across mobile, tablet, desktop
  useEffect(() => {
    const syncSize = () => {
      const w = window.innerWidth;
      if (w < 640) setSlotFontSize(34);
      else if (w < 1024) setSlotFontSize(42);
      else setSlotFontSize(52);
    };
    syncSize();
    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, []);

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
    <section className="relative overflow-hidden border-b border-[#E8E8E8] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
        {/* Left: Editorial Copy, Framer SlotTextWith3D, Search Bar */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E8] bg-[#FFF0F1] px-3.5 py-1.5 text-xs font-semibold text-[#C91D2B]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Jakarta&apos;s Community Dining &amp; Menu Atlas</span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.035em] text-[#1C1C1C] sm:text-5xl lg:text-[56px] lg:leading-[1.06]">
            Discover Places. Find Your Craving.
          </h1>

          {/* Mandatory Framer Slot Text with 3D rotating words */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-display text-xl font-semibold text-[#696969] sm:text-2xl">
              Real community-curated
            </span>
            <div className="inline-flex min-w-[200px] items-center">
              <SlotTextWith3D
                key={ROTATING_WORDS[wordIndex]}
                text={ROTATING_WORDS[wordIndex]}
                triggerMode="On View"
                flipAxis="Vertical (X)"
                flipDuration={0.48}
                staggerDelay={0.03}
                layerDistance={18}
                textColor="#E23744"
                hoverColor="#C91D2B"
                font={{
                  fontFamily: "var(--font-manrope), Manrope, sans-serif",
                  fontSize: slotFontSize,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  lineHeight: 1.05,
                  textAlign: "left",
                }}
              />
            </div>
          </div>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#696969] sm:text-lg">
            Explore extraordinary restaurants, discover their complete menus, and share the
            places you love.
          </p>

          {/* Search Bar wrapped in <search> + <form> */}
          <search className="mt-8">
            <form
              onSubmit={handleSubmit}
              action="/explore"
              method="GET"
              className="flex flex-col gap-2 rounded-2xl border border-[#E8E8E8] bg-white p-2 shadow-sm transition focus-within:border-[#E23744] focus-within:ring-4 focus-within:ring-[#FFF0F1] sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2 border-b border-[#E8E8E8] px-3 py-2 sm:border-b-0 sm:border-r sm:py-1">
                <MapPin
                  className="h-4 w-4 shrink-0 text-[#E23744]"
                  aria-hidden="true"
                />
                <label htmlFor="hero-area" className="visually-hidden">
                  Jakarta area
                </label>
                <select
                  id="hero-area"
                  name="area"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-transparent pr-2 text-sm font-medium text-[#1C1C1C] focus:outline-none"
                >
                  {JAKARTA_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
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
                  Search restaurants, dishes, or cuisines
                </label>
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search restaurants, dishes, or cuisines..."
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="min-h-11 w-full bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#696969] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="min-h-12 shrink-0 rounded-xl bg-[#E23744] px-6 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
              >
                Search
              </button>
            </form>
          </search>

          {/* Popular Suggestions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-[#696969]">Popular:</span>
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  router.push(`/explore?q=${encodeURIComponent(item)}`)
                }
                className="rounded-full border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-1.5 font-medium text-[#1C1C1C] transition hover:border-[#E23744] hover:bg-[#FFF0F1] hover:text-[#C91D2B]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Editorial Restaurant Table Photography */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] shadow-sm">
            <img
              src="/images/hero-jakarta-dining.jpg"
              alt="Curated Indonesian and contemporary Asian shared table in Jakarta"
              className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div className="border-t border-[#E8E8E8] bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#E23744]">
                    Featured Neighborhood
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold text-[#1C1C1C]">
                    Senopati · SCBD · Menteng · Kemang · PIK
                  </p>
                </div>
                <span className="rounded-full bg-[#FFF0F1] px-3 py-1 text-xs font-bold text-[#E23744]">
                  No Delivery Fees
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
