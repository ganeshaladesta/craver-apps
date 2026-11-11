import { HeroSection } from "@/components/home/HeroSection";
import { HomeDiscoveryClient } from "@/components/home/HomeDiscoveryClient";
import { HomeEditorialSections } from "@/components/home/HomeEditorialSections";
import { getHomeDiscoveryData } from "@/lib/queries/restaurants";

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
      {/* FULLSCREEN EDITORIAL HERO */}
      <HeroSection />

      {/* SECTION A: FOOD CATEGORIES, SECTION B: TRENDING RESTAURANTS, SECTION C: DISCOVER DISHES */}
      <HomeDiscoveryClient
        configured={configured}
        restaurants={trendingRestaurants}
        dishes={featuredDishes}
      />

      {/* SECTION D: LOCATIONS, SECTION E: EDITORIAL JOURNAL, SECTION F: COMMUNITY PROGRAMS, SECTION G: FINAL CTA */}
      <HomeEditorialSections
        configured={configured}
        featuredRestaurants={featuredRestaurants}
        curatedCollections={curatedCollections}
      />
    </div>
  );
}
