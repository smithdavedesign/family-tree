-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users if needed, but here we create a public profile table)
-- Note: Supabase handles auth in auth.users. This table is for app-specific user data.
create table public.users (
  id uuid references auth.users not null primary key,
  google_id text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trees table
create table public.trees (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.users(id) not null,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tree Members table
create table public.tree_members (
  tree_id uuid references public.trees(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('viewer', 'editor')) not null,
  primary key (tree_id, user_id)
);

-- Persons table
create table public.persons (
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
create table public.relationships (
  id uuid default uuid_generate_v4() primary key,
  tree_id uuid references public.trees(id) on delete cascade not null,
  person_1_id uuid references public.persons(id) on delete cascade not null,
  person_2_id uuid references public.persons(id) on delete cascade not null,
  type text check (type in ('parent_child', 'spouse')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Media table
create table public.media (
  id uuid default uuid_generate_v4() primary key,
  person_id uuid references public.persons(id) on delete cascade,
  url text not null,
  type text,
  google_media_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies (Basic setup - needs refinement based on specific access rules)
alter table public.users enable row level security;
alter table public.trees enable row level security;
alter table public.tree_members enable row level security;
alter table public.persons enable row level security;
alter table public.relationships enable row level security;
alter table public.media enable row level security;

-- Example Policy: Users can see their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Example Policy: Tree owners can do anything with their trees
create policy "Owners can do anything with their trees" on public.trees
  for all using (auth.uid() = owner_id);
