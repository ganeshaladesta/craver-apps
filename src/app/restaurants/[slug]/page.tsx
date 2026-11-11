import { notFound } from "next/navigation";
import { RestaurantDetailClient } from "@/components/restaurants/RestaurantDetailClient";
import { RestaurantUnconfiguredView } from "@/components/static/StaticPagesClient";
import { getRestaurantDetailBySlug } from "@/lib/queries/restaurants";

export const dynamic = "force-dynamic";

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RestaurantPage({
  params,
  searchParams,
}: RestaurantPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;

  const data = await getRestaurantDetailBySlug(slug);

  if (!data.configured) {
    return <RestaurantUnconfiguredView />;
  }

  if (!data.restaurant) {
    notFound();
  }

  return (
    <RestaurantDetailClient
      restaurant={data.restaurant}
      initialCategories={data.categories}
      initialItems={data.items}
      initialReviews={data.reviews}
      initialPhotos={data.photos}
      initialUpdates={data.updates}
      initialTab={initialTab}
    />
  );
}
