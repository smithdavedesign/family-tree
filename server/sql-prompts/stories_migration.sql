-- Phase 4: Storytelling / Blog
-- Run this in your Supabase SQL Editor

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb, -- TipTap JSON format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create story_people junction table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.story_people (
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (story_id, person_id)
);

-- 3. Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_people ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for stories
-- Viewers can view stories in their trees
CREATE POLICY "Viewers can view stories" ON public.stories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tree_members
            WHERE tree_members.tree_id = stories.tree_id
            AND tree_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = stories.tree_id
            AND trees.owner_id = auth.uid()
        )
    );

-- Editors can insert/update/delete stories
CREATE POLICY "Editors can manage stories" ON public.stories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tree_members
            WHERE tree_members.tree_id = stories.tree_id
            AND tree_members.user_id = auth.uid()
            AND tree_members.role IN ('editor', 'admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = stories.tree_id
            AND trees.owner_id = auth.uid()
        )
    );

-- 5. RLS Policies for story_people
-- Viewers can view
CREATE POLICY "Viewers can view story_people" ON public.story_people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE stories.id = story_people.story_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.tree_members
                    WHERE tree_members.tree_id = stories.tree_id
                    AND tree_members.user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.trees
                    WHERE trees.id = stories.tree_id
                    AND trees.owner_id = auth.uid()
                )
            )
        )
    );

-- Editors can manage
CREATE POLICY "Editors can manage story_people" ON public.story_people
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE stories.id = story_people.story_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.tree_members
                    WHERE tree_members.tree_id = stories.tree_id
                    AND tree_members.user_id = auth.uid()
                    AND tree_members.role IN ('editor', 'admin')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.trees
                    WHERE trees.id = stories.tree_id
                    AND trees.owner_id = auth.uid()
                )
            )
        )
    );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_stories_tree_id ON public.stories(tree_id);
CREATE INDEX IF NOT EXISTS idx_story_people_person_id ON public.story_people(person_id);
