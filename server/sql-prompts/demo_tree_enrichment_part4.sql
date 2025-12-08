-- Part 4: Advanced Photo Features Schema

-- 1. Create story_photos table for Many-to-Many relationship
CREATE TABLE IF NOT EXISTS story_photos (
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (story_id, photo_id)
);

-- 2. Ensure life_events has media_ids column (Array of UUIDs)
-- It might already exist based on the controller code, but let's be safe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'life_events' AND column_name = 'media_ids') THEN
        ALTER TABLE life_events ADD COLUMN media_ids UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Add RLS policies for story_photos (inherit from stories)
ALTER TABLE story_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view story photos if they can view the story
CREATE POLICY "Users can view story photos if they can view the story" ON story_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories s
            JOIN trees t ON t.id = s.tree_id
            WHERE s.id = story_photos.story_id
            AND (
                t.is_public = true
                OR s.author_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tree_members tm
                    WHERE tm.tree_id = s.tree_id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

-- Policy: Users can insert/update/delete story photos if they can edit the story
CREATE POLICY "Users can edit story photos if they can edit the story" ON story_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stories s
            WHERE s.id = story_photos.story_id
            AND (
                s.author_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM tree_members tm
                    WHERE tm.tree_id = s.tree_id
                    AND tm.user_id = auth.uid()
                    AND tm.role IN ('owner', 'editor')
                )
            )
        )
    );
