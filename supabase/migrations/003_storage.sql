-- CRAVER Database Migration 003
-- Supabase Storage buckets and RLS policies for restaurant, food, and avatar uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('restaurant-photos', 'restaurant-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('food-photos', 'food-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for uploaded CRAVER media
create policy "Public read access for CRAVER media"
  on storage.objects for select
  using (bucket_id in ('restaurant-photos', 'food-photos', 'avatars'));

-- Authenticated users upload into their own user-id folder prefix
create policy "Authenticated users upload own media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('restaurant-photos', 'food-photos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners or admins can update/replace their own media
create policy "Owners or admins update own media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('restaurant-photos', 'food-photos', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Owners or admins can delete their own media
create policy "Owners or admins delete own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('restaurant-photos', 'food-photos', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

