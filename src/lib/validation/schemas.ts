import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name must be at least 2 characters").max(120),
  tagline: z.string().trim().max(180).optional().default(""),
  description: z.string().trim().min(15, "Provide a meaningful description (15+ chars)").max(3000),
  primary_cuisine: z.string().trim().min(2, "Select a primary cuisine"),
  cuisines: z.array(z.string().trim().min(1)).min(1, "Select at least one cuisine"),
  district: z.string().trim().min(2, "Select or enter a Jakarta area / district"),
  city: z.string().trim().min(2).default("Jakarta"),
  address: z.string().trim().min(5, "Enter the street address").max(300),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL starting with https://")
    .or(z.literal(""))
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .nullable()
    .optional(),
  opening_hours: z.object({
    mon_fri: z.string().trim().min(3, "Specify weekday hours"),
    sat_sun: z.string().trim().min(3, "Specify weekend hours"),
    notes: z.string().trim().max(200).optional(),
  }),
  average_price_idr: z.number().int().min(10000, "Price must be at least Rp 10,000").max(10000000),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]),
  cover_image_url: z.string().trim().nullable().optional(),
});

export const menuCategorySchema = z.object({
  restaurant_id: z.string().uuid(),
  name: z.string().trim().min(2, "Category name required").max(80),
  description: z.string().trim().max(300).optional().default(""),
  sort_order: z.number().int().min(0).max(100).default(0),
});

export const menuItemSchema = z.object({
  restaurant_id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: z.string().trim().min(2, "Dish name required").max(120),
  description: z.string().trim().max(500).optional().default(""),
  price_idr: z.number().int().min(1000, "Price must be at least Rp 1,000").max(20000000),
  photo_url: z.string().trim().nullable().optional(),
  is_available: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  is_featured_dish: z.boolean().default(false),
  dietary_tags: z.array(z.string().trim()).default([]),
});

export const reviewSchema = z.object({
  restaurant_id: z.string().uuid(),
  rating: z.number().int().min(1, "Select 1 to 5 stars").max(5),
  title: z.string().trim().max(120).optional().default(""),
  comment: z.string().trim().min(10, "Review comment must be at least 10 characters").max(2000),
  visit_date: z.string().nullable().optional(),
  photo_urls: z.array(z.string().url()).max(6).default([]),
});

export const collectionSchema = z.object({
  title: z.string().trim().min(2, "Collection title required").max(100),
  description: z.string().trim().max(500).optional().default(""),
  is_public: z.boolean().default(true),
  cover_image_url: z.string().trim().nullable().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Full name required").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().min(2).max(60).default("Jakarta"),
  avatar_url: z.string().trim().nullable().optional(),
});

export const restaurantUpdateSchema = z.object({
  restaurant_id: z.string().uuid(),
  update_type: z.enum([
    "info_correction",
    "hours",
    "menu_update",
    "announcement",
    "closure_report",
  ]),
  title: z.string().trim().min(3, "Update title required").max(140),
  notes: z.string().trim().min(5, "Add details about this update").max(2000),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, WebP, or AVIF images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image file must be 5 MB or smaller.";
  }
  return null;
}

