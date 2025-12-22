-- Migration 012: Add missing columns to existing Photos table
-- The photos table already exists but is missing some columns

-- Add missing columns to photos table
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS google_media_id TEXT;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_person_id ON public.photos(person_id);
CREATE INDEX IF NOT EXISTS idx_photos_tree_id ON public.photos(tree_id);
CREATE INDEX IF NOT EXISTS idx_photos_taken_date ON public.photos(taken_date);
CREATE INDEX IF NOT EXISTS idx_photos_is_primary ON public.photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_photos_google_media_id ON public.photos(google_media_id);

-- Enable RLS (may already be enabled)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view photos for accessible trees" ON public.photos;
DROP POLICY IF EXISTS "Users can insert photos for accessible trees" ON public.photos;
DROP POLICY IF EXISTS "Users can update photos for accessible trees" ON public.photos;
DROP POLICY IF EXISTS "Users can delete photos for accessible trees" ON public.photos;

-- Create policies (users can view/manage photos for trees they have access to)
CREATE POLICY "Users can view photos for accessible trees" ON public.photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.persons 
            JOIN public.trees ON persons.tree_id = trees.id
            WHERE persons.id = photos.person_id 
            AND (trees.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.tree_members 
                WHERE tree_members.tree_id = trees.id 
                AND tree_members.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can insert photos for accessible trees" ON public.photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.persons 
            JOIN public.trees ON persons.tree_id = trees.id
            WHERE persons.id = photos.person_id 
            AND (trees.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.tree_members 
                WHERE tree_members.tree_id = trees.id 
                AND tree_members.user_id = auth.uid() 
                AND tree_members.role IN ('editor', 'owner')
            ))
        )
    );

CREATE POLICY "Users can update photos for accessible trees" ON public.photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.persons 
            JOIN public.trees ON persons.tree_id = trees.id
            WHERE persons.id = photos.person_id 
            AND (trees.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.tree_members 
                WHERE tree_members.tree_id = trees.id 
                AND tree_members.user_id = auth.uid() 
                AND tree_members.role IN ('editor', 'owner')
            ))
        )
    );

CREATE POLICY "Users can delete photos for accessible trees" ON public.photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.persons 
            JOIN public.trees ON persons.tree_id = trees.id
            WHERE persons.id = photos.person_id 
            AND (trees.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.tree_members 
                WHERE tree_members.tree_id = trees.id 
                AND tree_members.user_id = auth.uid() 
                AND tree_members.role IN ('editor', 'owner')
            ))
        )
    );

-- Create trigger to auto-populate tree_id from person_id
CREATE OR REPLACE FUNCTION set_photo_tree_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tree_id IS NULL AND NEW.person_id IS NOT NULL THEN
        SELECT tree_id INTO NEW.tree_id FROM public.persons WHERE id = NEW.person_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS photo_set_tree_id ON public.photos;
CREATE TRIGGER photo_set_tree_id
    BEFORE INSERT ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION set_photo_tree_id();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS photos_updated_at ON public.photos;
CREATE TRIGGER photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION update_photos_updated_at();

-- Backfill tree_id for existing photos
UPDATE public.photos 
SET tree_id = persons.tree_id 
FROM public.persons 
WHERE photos.person_id = persons.id AND photos.tree_id IS NULL;
