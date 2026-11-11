import { ExploreCatalogClient } from "@/components/explore/ExploreCatalogClient";
import { searchCatalog } from "@/lib/queries/restaurants";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const firstParam = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category) || "All";
  const area = firstParam(params.area) || "All Jakarta";
  const priceRange = firstParam(params.priceRange);
  const sort = (firstParam(params.sort) || "rating") as
    | "rating"
    | "reviews"
    | "price_asc"
    | "price_desc"
    | "newest";
  const view = firstParam(params.view) || "all";
  const page = Math.max(1, Number(firstParam(params.page) || "1") || 1);

  const result = await searchCatalog({
    q,
    category,
    area,
    priceRange,
    sort,
    page,
  });

  return (
    <ExploreCatalogClient
      configured={result.configured}
      initialQ={q}
      initialCategory={category}
      initialArea={area}
      initialPriceRange={priceRange}
      initialSort={sort}
      initialView={view}
      restaurants={result.restaurants}
      dishes={result.dishes}
      totalCount={result.totalCount}
      page={result.page}
      totalPages={result.totalPages}
    />
  );
}

