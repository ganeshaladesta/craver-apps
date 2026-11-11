-- CRAVER Database Migration 002
-- Row Level Security (RLS) helper functions, column guards, and table policies

-- ============================================================================
-- 1. ADMIN CHECK HELPER
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_suspended = false
  );
$$;

-- Prevent non-admin users from escalating their own role, verification, or approval status
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only administrators can change user roles.';
    end if;
    if new.is_suspended is distinct from old.is_suspended then
      raise exception 'Only administrators can change suspension state.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileged_fields on public.profiles;
create trigger trg_guard_profile_privileged_fields
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_fields();

create or replace function public.guard_restaurant_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.status not in ('draft', 'pending') then
        new.status := 'pending';
      end if;
      new.is_verified := false;
      new.is_featured := false;
      new.is_trending := false;
      new.approved_by := null;
      new.approved_at := null;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status and new.status not in ('draft', 'pending', 'archived') then
        raise exception 'Only administrators can approve or reject restaurants.';
      end if;
      new.is_verified := old.is_verified;
      new.is_featured := old.is_featured;
      new.is_trending := old.is_trending;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_restaurant_moderation_fields on public.restaurants;
create trigger trg_guard_restaurant_moderation_fields
  before insert or update on public.restaurants
  for each row execute function public.guard_restaurant_moderation_fields();

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.reviews enable row level security;
alter table public.photos enable row level security;
alter table public.favorites enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.restaurant_updates enable row level security;
alter table public.content_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ============================================================================
-- 4. RESTAURANTS POLICIES
-- ============================================================================
create policy "Public reads approved restaurants; owners & admins see theirs"
  on public.restaurants for select
  using (
    status = 'approved'
    or created_by = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users can submit restaurants"
  on public.restaurants for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (status in ('draft', 'pending') or public.is_admin())
  );

create policy "Owners update own non-approved restaurants; admins update all"
  on public.restaurants for update
  to authenticated
  using (
    (created_by = auth.uid() and status in ('draft', 'pending', 'rejected'))
    or public.is_admin()
  )
  with check (
    (created_by = auth.uid() and status in ('draft', 'pending', 'rejected', 'archived'))
    or public.is_admin()
  );

create policy "Owners delete own pending/draft restaurants; admins delete all"
  on public.restaurants for delete
  to authenticated
  using (
    (created_by = auth.uid() and status in ('draft', 'pending', 'rejected'))
    or public.is_admin()
  );

-- ============================================================================
-- 5. MENU CATEGORIES & MENU ITEMS POLICIES
-- ============================================================================
create policy "Public reads approved menu categories for approved restaurants"
  on public.menu_categories for select
  using (
    (
      status = 'approved'
      and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_id and r.status = 'approved'
      )
    )
    or created_by = auth.uid()
    or exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.created_by = auth.uid()
    )
    or public.is_admin()
  );

create policy "Authenticated users can add menu categories"
  on public.menu_categories for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (status = 'pending' or public.is_admin())
  );

create policy "Owners or admins can update menu categories"
  on public.menu_categories for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (
    (created_by = auth.uid() and status = 'pending')
    or public.is_admin()
  );

create policy "Owners or admins can delete menu categories"
  on public.menu_categories for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "Public reads approved menu items for approved restaurants"
  on public.menu_items for select
  using (
    (
      status = 'approved'
      and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_id and r.status = 'approved'
      )
    )
    or created_by = auth.uid()
    or exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.created_by = auth.uid()
    )
    or public.is_admin()
  );

create policy "Authenticated users can add menu items"
  on public.menu_items for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (status = 'pending' or public.is_admin())
  );

create policy "Owners or admins can update menu items"
  on public.menu_items for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (
    (created_by = auth.uid() and status = 'pending')
    or public.is_admin()
  );

create policy "Owners or admins can delete menu items"
  on public.menu_items for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ============================================================================
-- 6. REVIEWS POLICIES
-- ============================================================================
create policy "Public reads published reviews; owners & admins see all"
  on public.reviews for select
  using (
    status = 'published'
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users write reviews for approved restaurants"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.status = 'approved'
    )
  );

create policy "Users update own reviews; admins update all"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users delete own reviews; admins delete all"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 7. PHOTOS POLICIES
-- ============================================================================
create policy "Public reads approved photos; owners & admins see all"
  on public.photos for select
  using (
    status = 'approved'
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users upload photos"
  on public.photos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners update own photos; admins manage all"
  on public.photos for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owners delete own photos; admins delete all"
  on public.photos for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 8. FAVORITES POLICIES
-- ============================================================================
create policy "Users manage own favorites"
  on public.favorites for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 9. COLLECTIONS & COLLECTION ITEMS POLICIES
-- ============================================================================
create policy "Public reads public collections; owners & admins see all"
  on public.collections for select
  using (
    is_public = true
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users create own collections"
  on public.collections for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners update own collections; admins update all"
  on public.collections for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owners delete own collections; admins delete all"
  on public.collections for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Public reads items in accessible collections"
  on public.collection_items for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.is_public = true or c.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Collection owners manage items"
  on public.collection_items for all
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- 10. RESTAURANT UPDATES, REPORTS, NOTIFICATIONS & AUDIT LOGS
-- ============================================================================
create policy "Public reads approved updates; submitters & admins see own/all"
  on public.restaurant_updates for select
  using (
    (status = 'approved' and update_type <> 'closure_report')
    or submitted_by = auth.uid()
    or public.is_admin()
  );

create policy "Authenticated users submit restaurant updates"
  on public.restaurant_updates for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and (status = 'pending' or public.is_admin())
  );

create policy "Admins moderate restaurant updates"
  on public.restaurant_updates for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Submitters delete pending updates; admins delete all"
  on public.restaurant_updates for delete
  to authenticated
  using ((submitted_by = auth.uid() and status = 'pending') or public.is_admin());

create policy "Reporters see own reports; admins see all"
  on public.content_reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "Authenticated users submit content reports"
  on public.content_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Admins manage content reports"
  on public.content_reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users manage own notifications"
  on public.notifications for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Only admins read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy "Only admins insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (public.is_admin());
