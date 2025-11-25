-- Complete Setup Script for Family Tree App
-- Run this entire script in the Supabase SQL Editor

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
-- Users table
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  google_id text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trees table
create table if not exists public.trees (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.users(id) not null,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tree Members table
create table if not exists public.tree_members (
  tree_id uuid references public.trees(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('viewer', 'editor')) not null,
  primary key (tree_id, user_id)
);

-- Persons table
create table if not exists public.persons (
  id uuid default uuid_generate_v4() primary key,
  tree_id uuid references public.trees(id) on delete cascade not null,
  first_name text not null,
  last_name text,
  dob date,
  dod date,
  pob text,
  gender text,
  bio text,
  occupation text,
  profile_photo_url text,
  attributes jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Relationships table
create table if not exists public.relationships (
  id uuid default uuid_generate_v4() primary key,
  tree_id uuid references public.trees(id) on delete cascade not null,
  person_1_id uuid references public.persons(id) on delete cascade not null,
  person_2_id uuid references public.persons(id) on delete cascade not null,
  type text check (type in ('parent_child', 'spouse')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Media table
create table if not exists public.media (
  id uuid default uuid_generate_v4() primary key,
  person_id uuid references public.persons(id) on delete cascade,
  url text not null,
  type text,
  google_media_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RLS POLICIES
-- Enable RLS
alter table public.users enable row level security;
alter table public.trees enable row level security;
alter table public.tree_members enable row level security;
alter table public.persons enable row level security;
alter table public.relationships enable row level security;
alter table public.media enable row level security;

-- Users Policies
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Trees Policies
drop policy if exists "Owners can do anything with their trees" on public.trees;
create policy "Owners can do anything with their trees" on public.trees
  for all using (auth.uid() = owner_id);

-- Persons Policies
drop policy if exists "Tree owners can manage persons" on public.persons;
create policy "Tree owners can manage persons" on public.persons
  for all using (
    exists (
      select 1 from public.trees
      where trees.id = persons.tree_id
      and trees.owner_id = auth.uid()
    )
  );

-- Relationships Policies
drop policy if exists "Tree owners can manage relationships" on public.relationships;
create policy "Tree owners can manage relationships" on public.relationships
  for all using (
    exists (
      select 1 from public.trees
      where trees.id = relationships.tree_id
      and trees.owner_id = auth.uid()
    )
  );

-- Media Policies
drop policy if exists "Tree owners can manage media" on public.media;
create policy "Tree owners can manage media" on public.media
  for all using (
    exists (
      select 1 from public.persons
      join public.trees on persons.tree_id = trees.id
      where persons.id = media.person_id
      and trees.owner_id = auth.uid()
    )
  );
