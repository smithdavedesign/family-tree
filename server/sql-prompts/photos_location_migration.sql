-- Phase F.14: Photo Map View
-- Run this in your Supabase SQL Editor

-- 1. Add location columns to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_name text;

-- 2. Create index for faster geospatial queries (if we use PostGIS later, but good for filtering now)
CREATE INDEX IF NOT EXISTS idx_photos_location ON public.photos (latitude, longitude);
