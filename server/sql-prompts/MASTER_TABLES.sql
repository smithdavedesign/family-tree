-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.album_photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  album_id uuid NOT NULL,
  photo_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  added_by uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT album_photos_pkey PRIMARY KEY (id),
  CONSTRAINT album_photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT album_photos_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(id),
  CONSTRAINT album_photos_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);
CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tree_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  cover_photo_id uuid,
  is_private boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT albums_pkey PRIMARY KEY (id),
  CONSTRAINT albums_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT albums_cover_photo_id_fkey FOREIGN KEY (cover_photo_id) REFERENCES public.photos(id),
  CONSTRAINT albums_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  person_id uuid,
  url text NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  source text NOT NULL,
  external_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.google_connections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone NOT NULL,
  scopes ARRAY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  google_email text,
  google_name text,
  google_picture text,
  CONSTRAINT google_connections_pkey PRIMARY KEY (id),
  CONSTRAINT google_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tree_id uuid NOT NULL,
  inviter_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['editor'::text, 'viewer'::text])),
  token text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  used_at timestamp with time zone,
  used_by uuid,
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
  CONSTRAINT invitations_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id)
);
CREATE TABLE public.life_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL,
  event_type character varying NOT NULL,
  title character varying NOT NULL,
  date date,
  start_date date,
  end_date date,
  location character varying,
  description text,
  media_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT life_events_pkey PRIMARY KEY (id),
  CONSTRAINT life_events_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  person_id uuid,
  url text NOT NULL,
  type text,
  google_media_id text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT media_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.persons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tree_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text,
  dob date,
  dod date,
  pob text,
  gender text,
  bio text,
  occupation text,
  profile_photo_url text,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  place_of_death text,
  cause_of_death text,
  burial_place text,
  occupation_history text,
  education text,
  CONSTRAINT persons_pkey PRIMARY KEY (id),
  CONSTRAINT persons_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL,
  url text NOT NULL,
  caption text,
  taken_date date,
  location text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  width integer,
  height integer,
  orientation text CHECK (orientation = ANY (ARRAY['landscape'::text, 'portrait'::text, 'square'::text])),
  year integer,
  month_year text,
  latitude double precision,
  longitude double precision,
  location_name text,
  CONSTRAINT photos_pkey PRIMARY KEY (id),
  CONSTRAINT photos_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.relationships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tree_id uuid NOT NULL,
  person_1_id uuid NOT NULL,
  person_2_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['parent_child'::text, 'spouse'::text, 'adoptive_parent_child'::text, 'step_parent_child'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text CHECK (status = ANY (ARRAY['married'::text, 'divorced'::text, 'separated'::text, 'widowed'::text, 'partners'::text])),
  CONSTRAINT relationships_pkey PRIMARY KEY (id),
  CONSTRAINT relationships_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT relationships_person_1_id_fkey FOREIGN KEY (person_1_id) REFERENCES public.persons(id),
  CONSTRAINT relationships_person_2_id_fkey FOREIGN KEY (person_2_id) REFERENCES public.persons(id)
);
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tree_id uuid NOT NULL,
  author_id uuid,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT stories_pkey PRIMARY KEY (id),
  CONSTRAINT stories_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.story_people (
  story_id uuid NOT NULL,
  person_id uuid NOT NULL,
  CONSTRAINT story_people_pkey PRIMARY KEY (story_id, person_id),
  CONSTRAINT story_people_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id),
  CONSTRAINT story_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.story_photos (
  story_id uuid NOT NULL,
  photo_id uuid NOT NULL,
  order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_photos_pkey PRIMARY KEY (story_id, photo_id),
  CONSTRAINT story_photos_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id),
  CONSTRAINT story_photos_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(id)
);
CREATE TABLE public.tree_members (
  tree_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text])),
  CONSTRAINT tree_members_pkey PRIMARY KEY (tree_id, user_id),
  CONSTRAINT tree_members_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT tree_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.trees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT trees_pkey PRIMARY KEY (id),
  CONSTRAINT trees_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  google_id text,
  email text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);