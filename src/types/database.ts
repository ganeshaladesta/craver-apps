export type UserRole = "user" | "admin";

export type RestaurantStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "archived";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ReviewStatus = "published" | "flagged" | "hidden";

export type PhotoType = "cover" | "gallery" | "food" | "menu" | "review";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string;
  city: string;
  role: UserRole;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  mon_fri?: string;
  sat_sun?: string;
  notes?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  primary_cuisine: string;
  cuisines: string[];
  district: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  opening_hours: OpeningHours;
  average_price_idr: number;
  price_range: "$" | "$$" | "$$$" | "$$$$";
  cover_image_url: string | null;
  is_verified: boolean;
  is_featured: boolean;
  is_trending: boolean;
  rating_avg: number;
  reviews_count: number;
  status: RestaurantStatus;
  rejection_reason: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  sort_order: number;
  status: ModerationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price_idr: number;
  photo_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_featured_dish: boolean;
  dietary_tags: string[];
  sort_order: number;
  status: ModerationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  restaurant?: Pick<
    Restaurant,
    "id" | "slug" | "name" | "district" | "city" | "rating_avg"
  >;
}

export interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  visit_date: string | null;
  photo_urls: string[];
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url">;
  restaurant?: Pick<Restaurant, "id" | "slug" | "name">;
}

export interface Photo {
  id: string;
  restaurant_id: string;
  menu_item_id: string | null;
  review_id: string | null;
  user_id: string | null;
  url: string;
  storage_path: string | null;
  caption: string;
  photo_type: PhotoType;
  status: "pending" | "approved" | "rejected" | "flagged";
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  restaurant?: Pick<Restaurant, "id" | "slug" | "name">;
}

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
  restaurant?: Restaurant;
}

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string | null;
  is_public: boolean;
  is_curated: boolean;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url">;
  collection_items?: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  restaurant_id: string;
  note: string;
  sort_order: number;
  created_at: string;
  restaurant?: Restaurant;
}

export interface RestaurantUpdate {
  id: string;
  restaurant_id: string;
  submitted_by: string | null;
  update_type:
    | "info_correction"
    | "hours"
    | "menu_update"
    | "announcement"
    | "closure_report";
  title: string;
  notes: string;
  payload: Record<string, unknown>;
  status: ModerationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  restaurant?: Pick<Restaurant, "id" | "slug" | "name">;
  submitter?: Pick<Profile, "id" | "full_name" | "email">;
}

export interface ContentReport {
  id: string;
  reporter_id: string | null;
  target_type: "restaurant" | "review" | "photo" | "menu_item";
  target_id: string;
  reason: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Pick<Profile, "id" | "full_name" | "email">;
}

