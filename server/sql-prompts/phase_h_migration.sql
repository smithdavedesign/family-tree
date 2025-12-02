-- Phase H: Data Structure Enhancements
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to persons table
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS place_of_death text,
ADD COLUMN IF NOT EXISTS cause_of_death text,
ADD COLUMN IF NOT EXISTS burial_place text,
ADD COLUMN IF NOT EXISTS occupation_history text,
ADD COLUMN IF NOT EXISTS education text;

-- 2. Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_id uuid REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  caption text,
  taken_date date,
  location text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy for photos (same as persons/trees)
-- Users can view photos if they have viewer access to the tree
CREATE POLICY "Users can view photos of trees they have access to" ON public.photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persons p
      JOIN public.tree_members tm ON p.tree_id = tm.tree_id
      WHERE p.id = public.photos.person_id
      AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.persons p
      JOIN public.trees t ON p.tree_id = t.id
      WHERE p.id = public.photos.person_id
      AND t.owner_id = auth.uid()
    )
  );

-- Users can edit photos if they have editor access to the tree
CREATE POLICY "Users can edit photos of trees they have editor access to" ON public.photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.persons p
      JOIN public.tree_members tm ON p.tree_id = tm.tree_id
      WHERE p.id = public.photos.person_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'editor'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.persons p
      JOIN public.trees t ON p.tree_id = t.id
      WHERE p.id = public.photos.person_id
      AND t.owner_id = auth.uid()
    )
  );

-- 3. Update relationships table for status
ALTER TABLE public.relationships 
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('married', 'divorced', 'separated', 'widowed', 'partners'));

-- Set default status for existing spouse relationships
UPDATE public.relationships 
SET status = 'married' 
WHERE type = 'spouse' AND status IS NULL;
