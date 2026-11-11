-- CRAVER Database Schema Migration 001
-- Core tables, constraints, indexes, and triggers

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ============================================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  username text unique,
  avatar_url text,
  bio text default '',
  city text not null default 'Jakarta',
  role text not null default 'user' check (role in ('user', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================================================
-- 2. RESTAURANTS
-- ============================================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  primary_cuisine text not null,
  cuisines text[] not null default '{}',
  district text not null,
  city text not null default 'Jakarta',
  address text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  website text,
  email text,
  opening_hours jsonb not null default '{"mon_fri":"10:00 - 22:00","sat_sun":"10:00 - 23:00"}'::jsonb,
  average_price_idr integer not null default 120000 check (average_price_idr >= 0),
  price_range text not null default '$$' check (price_range in ('$', '$$', '$$$', '$$$$')),
  cover_image_url text,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  rating_avg numeric(3, 2) not null default 0.00,
  reviews_count integer not null default 0,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurants_status on public.restaurants(status);
create index if not exists idx_restaurants_primary_cuisine on public.restaurants(primary_cuisine);
create index if not exists idx_restaurants_district on public.restaurants(district);
create index if not exists idx_restaurants_trending on public.restaurants(is_trending) where status = 'approved';
create index if not exists idx_restaurants_featured on public.restaurants(is_featured) where status = 'approved';
create index if not exists idx_restaurants_rating on public.restaurants(rating_avg desc, reviews_count desc);
create index if not exists idx_restaurants_name_trgm on public.restaurants using gin (name gin_trgm_ops);
create index if not exists idx_restaurants_created_by on public.restaurants(created_by);

-- ============================================================================
-- 3. MENU CATEGORIES & MENU ITEMS
-- ============================================================================
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text default '',
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create index if not exists idx_menu_categories_restaurant on public.menu_categories(restaurant_id, sort_order);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_idr integer not null check (price_idr >= 0),
  photo_url text,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  is_featured_dish boolean not null default false,
  dietary_tags text[] not null default '{}',
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_items_restaurant on public.menu_items(restaurant_id, category_id, sort_order);
create index if not exists idx_menu_items_featured_dish on public.menu_items(is_featured_dish) where status = 'approved';
create index if not exists idx_menu_items_name_trgm on public.menu_items using gin (name gin_trgm_ops);

-- ============================================================================
-- 4. REVIEWS (1 review per user per restaurant)
-- ============================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  comment text not null,
  visit_date date,
  photo_urls text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'flagged', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create index if not exists idx_reviews_restaurant on public.reviews(restaurant_id, created_at desc);
create index if not exists idx_reviews_user on public.reviews(user_id, created_at desc);

-- ============================================================================
-- 5. PHOTOS
-- ============================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  url text not null,
  storage_path text,
  caption text default '',
  photo_type text not null default 'gallery' check (photo_type in ('cover', 'gallery', 'food', 'menu', 'review')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_photos_restaurant on public.photos(restaurant_id, created_at desc);
create index if not exists idx_photos_user on public.photos(user_id);

-- ============================================================================
-- 6. FAVORITES
-- ============================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create index if not exists idx_favorites_user on public.favorites(user_id, created_at desc);

-- ============================================================================
-- 7. COLLECTIONS & COLLECTION ITEMS
-- ============================================================================
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null default '',
  cover_image_url text,
  is_public boolean not null default true,
  is_curated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collections_user on public.collections(user_id, created_at desc);
create index if not exists idx_collections_public on public.collections(is_public, is_curated);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  note text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, restaurant_id)
);

create index if not exists idx_collection_items_collection on public.collection_items(collection_id, sort_order);

-- ============================================================================
-- 8. RESTAURANT UPDATES / MODERATION QUEUE / REPORTS / NOTIFICATIONS / AUDIT
-- ============================================================================
create table if not exists public.restaurant_updates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null,
  update_type text not null check (update_type in ('info_correction', 'hours', 'menu_update', 'announcement', 'closure_report')),
  title text not null,
  notes text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurant_updates_restaurant on public.restaurant_updates(restaurant_id, status);
create index if not exists idx_restaurant_updates_status on public.restaurant_updates(status, created_at desc);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('restaurant', 'review', 'photo', 'menu_item')),
  target_id uuid not null,
  reason text not null,
  details text default '',
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_reports_status on public.content_reports(status, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- ============================================================================
-- 9. TRIGGERS & FUNCTIONS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_menu_categories_updated_at on public.menu_categories;
create trigger trg_menu_categories_updated_at before update on public.menu_categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_menu_items_updated_at on public.menu_items;
create trigger trg_menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at before update on public.photos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurant_updates_updated_at on public.restaurant_updates;
create trigger trg_restaurant_updates_updated_at before update on public.restaurant_updates
  for each row execute function public.set_updated_at();

-- Automatically create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := regexp_replace(lower(split_part(coalesce(new.email, 'craver'), '@', 1)), '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'craver';
  end if;

  insert into public.profiles (id, email, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Food Lover'), '@', 1)),
    base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalculate rating_avg and reviews_count on restaurants whenever reviews change
create or replace function public.recalculate_restaurant_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_restaurant_id uuid;
begin
  target_restaurant_id := coalesce(new.restaurant_id, old.restaurant_id);

  update public.restaurants
  set
    rating_avg = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where restaurant_id = target_restaurant_id and status = 'published'
    ), 0.00),
    reviews_count = coalesce((
      select count(*)::integer
      from public.reviews
      where restaurant_id = target_restaurant_id and status = 'published'
    ), 0)
  where id = target_restaurant_id;

  return null;
end;
$$;

drop trigger if exists trg_recalculate_restaurant_rating on public.reviews;
create trigger trg_recalculate_restaurant_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recalculate_restaurant_rating();
