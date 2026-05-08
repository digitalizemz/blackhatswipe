-- ============================================================
-- Black Hat Swipe — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  plan       text not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SWIPE ITEMS
-- ============================================================
create table if not exists public.swipe_items (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  url        text,
  image_url  text,
  niche      text,
  type       text,        -- e.g. 'ad', 'email', 'landing_page', 'vsl'
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.swipe_items enable row level security;

create policy "Users can manage own swipe items"
  on public.swipe_items for all
  using (auth.uid() = user_id);

-- ============================================================
-- OFFERS
-- ============================================================
create table if not exists public.offers (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  niche      text,
  sub_niche  text,
  platform   text,        -- e.g. 'clickbank', 'digistore', 'cj', 'custom'
  language   text default 'en',
  url        text,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

-- All authenticated users can read offers (shared library)
drop policy if exists "Authenticated users can view offers" on public.offers;
create policy "Authenticated users can read offers"
  on public.offers for select to authenticated
  using (true);

-- offer_files: authenticated users can read all rows
alter table if exists public.offer_files enable row level security;
drop policy if exists "Auth read offer_files" on public.offer_files;
create policy "Auth read offer_files"
  on public.offer_files for select to authenticated
  using (true);

-- ============================================================
-- CREATIVES
-- ============================================================
create table if not exists public.creatives (
  id         uuid primary key default uuid_generate_v4(),
  offer_id   uuid references public.offers(id) on delete set null,
  platform   text,        -- e.g. 'facebook', 'tiktok', 'google', 'native'
  niche      text,
  angle      text,
  media_url  text,
  created_at timestamptz not null default now()
);

alter table public.creatives enable row level security;

create policy "Authenticated users can view creatives"
  on public.creatives for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists swipe_items_user_id_idx on public.swipe_items(user_id);
create index if not exists swipe_items_niche_idx on public.swipe_items(niche);
create index if not exists creatives_offer_id_idx on public.creatives(offer_id);
create index if not exists offers_niche_idx on public.offers(niche);
