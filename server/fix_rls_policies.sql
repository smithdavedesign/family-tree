-- Fix RLS Policies for Tree Creation
-- Run this in Supabase SQL Editor

-- 1. Update trees table to reference auth.users instead of public.users
ALTER TABLE public.trees DROP CONSTRAINT IF EXISTS trees_owner_id_fkey;
ALTER TABLE public.trees 
  ADD CONSTRAINT trees_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES auth.users(id);

-- 2. Drop old policies
DROP POLICY IF EXISTS "Owners can do anything with their trees" ON public.trees;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- 3. Create new policies for trees
CREATE POLICY "Users can insert their own trees" 
  ON public.trees 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own trees" 
  ON public.trees 
  FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own trees" 
  ON public.trees 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own trees" 
  ON public.trees 
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- 4. Create policies for persons (tree members can edit)
DROP POLICY IF EXISTS "Tree owners can manage persons" ON public.persons;

CREATE POLICY "Users can insert persons in their trees" 
  ON public.persons 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trees 
      WHERE trees.id = persons.tree_id 
      AND trees.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view persons in their trees" 
  ON public.persons 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.trees 
      WHERE trees.id = persons.tree_id 
      AND trees.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update persons in their trees" 
  ON public.persons 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.trees 
      WHERE trees.id = persons.tree_id 
      AND trees.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete persons in their trees" 
  ON public.persons 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.trees 
      WHERE trees.id = persons.tree_id 
      AND trees.owner_id = auth.uid()
    )
  );

-- 5. Create policies for relationships
DROP POLICY IF EXISTS "Tree owners can manage relationships" ON public.relationships;

CREATE POLICY "Users can manage relationships in their trees" 
  ON public.relationships 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.trees 
      WHERE trees.id = relationships.tree_id 
      AND trees.owner_id = auth.uid()
    )
  );

-- 6. Create policies for media
DROP POLICY IF EXISTS "Tree owners can manage media" ON public.media;

CREATE POLICY "Users can manage media in their trees" 
  ON public.media 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      JOIN public.trees ON trees.id = persons.tree_id
      WHERE persons.id = media.person_id 
      AND trees.owner_id = auth.uid()
    )
  );

-- 7. Users table policies (optional - only if you need public.users)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile" 
  ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);
