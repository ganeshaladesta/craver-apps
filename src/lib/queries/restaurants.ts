import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  Collection,
  MenuCategory,
  MenuItem,
  Photo,
  Restaurant,
  RestaurantUpdate,
  Review,
} from "@/types/database";

export interface HomeDiscoveryData {
  configured: boolean;
  trendingRestaurants: Restaurant[];
  featuredRestaurants: Restaurant[];
  featuredDishes: MenuItem[];
  curatedCollections: Collection[];
}

export async function getHomeDiscoveryData(): Promise<HomeDiscoveryData> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      trendingRestaurants: [],
      featuredRestaurants: [],
      featuredDishes: [],
      curatedCollections: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      trendingRestaurants: [],
      featuredRestaurants: [],
      featuredDishes: [],
      curatedCollections: [],
    };
  }

  const [trendingRes, featuredRes, dishesRes, collectionsRes] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved")
      .order("is_trending", { ascending: false })
      .order("rating_avg", { ascending: false })
      .order("reviews_count", { ascending: false })
      .limit(12),
    supabase
      .from("restaurants")
      .select("*")
      .eq("status", "approved")
      .eq("is_featured", true)
      .order("rating_avg", { ascending: false })
      .limit(4),
    supabase
      .from("menu_items")
      .select(
        "*, restaurant:restaurants!inner(id, slug, name, district, city, rating_avg, status)"
      )
      .eq("status", "approved")
      .eq("is_available", true)
      .eq("restaurants.status", "approved")
      .order("is_featured_dish", { ascending: false })
      .order("is_popular", { ascending: false })
      .limit(12),
    supabase
      .from("collections")
      .select(
        "*, profile:profiles(id, full_name, username, avatar_url), collection_items(id)"
      )
      .eq("is_public", true)
      .order("is_curated", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    configured: true,
    trendingRestaurants: (trendingRes.data ?? []) as Restaurant[],
    featuredRestaurants: (featuredRes.data ?? []) as Restaurant[],
    featuredDishes: (dishesRes.data ?? []) as MenuItem[],
    curatedCollections: (collectionsRes.data ?? []) as Collection[],
  };
}

export interface SearchCatalogParams {
  q?: string;
  category?: string;
  area?: string;
  priceRange?: string;
  sort?: "rating" | "reviews" | "price_asc" | "price_desc" | "newest";
  page?: number;
  pageSize?: number;
}

export async function searchCatalog({
  q = "",
  category = "All",
  area = "All Jakarta",
  priceRange = "",
  sort = "rating",
  page = 1,
  pageSize = 9,
}: SearchCatalogParams) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      restaurants: [] as Restaurant[],
      dishes: [] as MenuItem[],
      totalCount: 0,
      page,
      totalPages: 1,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      restaurants: [] as Restaurant[],
      dishes: [] as MenuItem[],
      totalCount: 0,
      page,
      totalPages: 1,
    };
  }

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("restaurants")
    .select("*", { count: "exact" })
    .eq("status", "approved");

  if (category && category !== "All") {
    query = query.or(
      `primary_cuisine.eq.${category},cuisines.cs.{${category}}`
    );
  }

  if (area && area !== "All Jakarta" && area !== "Jakarta") {
    query = query.ilike("district", `%${area}%`);
  }

  if (priceRange) {
    query = query.eq("price_range", priceRange);
  }

  const trimmed = q.trim();
  if (trimmed) {
    query = query.or(
      `name.ilike.%${trimmed}%,tagline.ilike.%${trimmed}%,primary_cuisine.ilike.%${trimmed}%,district.ilike.%${trimmed}%`
    );
  }

  if (sort === "reviews") {
    query = query.order("reviews_count", { ascending: false });
  } else if (sort === "price_asc") {
    query = query.order("average_price_idr", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("average_price_idr", { ascending: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("rating_avg", { ascending: false })
      .order("reviews_count", { ascending: false });
  }

  const { data: restaurantsData, count } = await query.range(from, to);

  // Matching dishes if query or category present
  let dishQuery = supabase
    .from("menu_items")
    .select(
      "*, restaurant:restaurants!inner(id, slug, name, district, city, rating_avg, status)"
    )
    .eq("status", "approved")
    .eq("is_available", true)
    .eq("restaurants.status", "approved")
    .limit(6);

  if (trimmed) {
    dishQuery = dishQuery.or(
      `name.ilike.%${trimmed}%,description.ilike.%${trimmed}%`
    );
  } else {
    dishQuery = dishQuery.eq("is_popular", true);
  }

  const { data: dishesData } = await dishQuery;

  const totalCount = count ?? 0;
  return {
    configured: true,
    restaurants: (restaurantsData ?? []) as Restaurant[],
    dishes: (dishesData ?? []) as MenuItem[],
    totalCount,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getRestaurantDetailBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return { configured: false as const, restaurant: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { configured: false as const, restaurant: null };
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) {
    return { configured: true as const, restaurant: null };
  }

  const [categoriesRes, itemsRes, reviewsRes, photosRes, updatesRes] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("reviews")
        .select(
          "*, profile:profiles(id, full_name, username, avatar_url)"
        )
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("photos")
        .select("*, profile:profiles(id, full_name, avatar_url)")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("restaurant_updates")
        .select("*, submitter:profiles!restaurant_updates_submitted_by_fkey(id, full_name, email)")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false }),
    ]);

  return {
    configured: true as const,
    restaurant: restaurant as Restaurant,
    categories: (categoriesRes.data ?? []) as MenuCategory[],
    items: (itemsRes.data ?? []) as MenuItem[],
    reviews: (reviewsRes.data ?? []) as Review[],
    photos: (photosRes.data ?? []) as Photo[],
    updates: (updatesRes.data ?? []) as RestaurantUpdate[],
  };
}

