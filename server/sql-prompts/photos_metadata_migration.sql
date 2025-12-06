-- Phase H.2: Photo Metadata Enhancements
-- Run this in your Supabase SQL Editor

-- 1. Add metadata columns to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS orientation text CHECK (orientation IN ('landscape', 'portrait', 'square')),
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS month_year text; -- Format: 'YYYY-MM'

-- 2. Create index for faster filtering/sorting
CREATE INDEX IF NOT EXISTS idx_photos_tree_date ON public.photos (person_id, taken_date);
CREATE INDEX IF NOT EXISTS idx_photos_year ON public.photos (year);
