import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantDetailClient } from "@/components/restaurants/RestaurantDetailClient";
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
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#1C1C1C]">
          Supabase Not Configured
        </h1>
        <p className="mt-2 text-sm text-[#696969]">
          Add your Supabase credentials in <code className="font-mono">.env.local</code> and
          execute <code className="font-mono">supabase/seed.sql</code> to inspect live
          restaurant profiles, menus, and reviews.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#E23744] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
        >
          Back Home
        </Link>
      </div>
    );
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

