-- Migration: Albums & Collections Feature
-- Creates tables for photo albums and album-photo associations

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create album_photos junction table
CREATE TABLE IF NOT EXISTS album_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_by UUID NOT NULL REFERENCES auth.users(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(album_id, photo_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_albums_tree_id ON albums(tree_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_by ON albums(created_by);
CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo_id ON album_photos(photo_id);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums table

-- Viewers can read albums in their trees
DROP POLICY IF EXISTS "Users can view albums in their trees" ON albums;
CREATE POLICY "Users can view albums in their trees"
ON albums FOR SELECT
USING (
    tree_id IN (
        SELECT tree_id FROM tree_members 
        WHERE user_id = auth.uid()
    )
);

-- Editors can create albums
DROP POLICY IF EXISTS "Editors can create albums" ON albums;
CREATE POLICY "Editors can create albums"
ON albums FOR INSERT
WITH CHECK (
    tree_id IN (
        SELECT tree_id FROM tree_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'editor')
    )
);

-- Editors can update albums
DROP POLICY IF EXISTS "Editors can update albums" ON albums;
CREATE POLICY "Editors can update albums"
ON albums FOR UPDATE
USING (
    tree_id IN (
        SELECT tree_id FROM tree_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'editor')
    )
);

-- Owners can delete albums
DROP POLICY IF EXISTS "Owners can delete albums" ON albums;
CREATE POLICY "Owners can delete albums"
ON albums FOR DELETE
USING (
    tree_id IN (
        SELECT tree_id FROM tree_members 
        WHERE user_id = auth.uid() 
        AND role = 'owner'
    )
);

-- RLS Policies for album_photos table

-- Users can view album photos in their trees
DROP POLICY IF EXISTS "Users can view album photos" ON album_photos;
CREATE POLICY "Users can view album photos"
ON album_photos FOR SELECT
USING (
    album_id IN (
        SELECT id FROM albums WHERE tree_id IN (
            SELECT tree_id FROM tree_members WHERE user_id = auth.uid()
        )
    )
);

-- Editors can manage album photos
DROP POLICY IF EXISTS "Editors can manage album photos" ON album_photos;
CREATE POLICY "Editors can manage album photos"
ON album_photos FOR ALL
USING (
    album_id IN (
        SELECT id FROM albums WHERE tree_id IN (
            SELECT tree_id FROM tree_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_album_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE FUNCTION update_album_updated_at();

-- Add audit logging trigger for albums
CREATE OR REPLACE FUNCTION log_album_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
        VALUES (auth.uid(), 'CREATE', 'album', NEW.id, jsonb_build_object('name', NEW.name, 'tree_id', NEW.tree_id));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
        VALUES (auth.uid(), 'UPDATE', 'album', NEW.id, jsonb_build_object('name', NEW.name));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
        VALUES (auth.uid(), 'DELETE', 'album', OLD.id, jsonb_build_object('name', OLD.name));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_album_changes ON albums;
CREATE TRIGGER audit_album_changes
    AFTER INSERT OR UPDATE OR DELETE ON albums
    FOR EACH ROW
    EXECUTE FUNCTION log_album_changes();
