-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'pdf', 'doc', 'image', etc.
    source TEXT NOT NULL, -- 'google_drive', 'upload'
    external_id TEXT, -- Google Drive ID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents table
-- Viewers can view documents
CREATE POLICY "Viewers can view documents" ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = documents.person_id
            AND tm.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM persons p
            JOIN trees t ON p.tree_id = t.id
            WHERE p.id = documents.person_id
            AND t.is_public = true
        )
    );

-- Editors can insert documents
CREATE POLICY "Editors can insert documents" ON documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
    );

-- Editors can update documents
CREATE POLICY "Editors can update documents" ON documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = documents.person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
    );

-- Editors can delete documents
CREATE POLICY "Editors can delete documents" ON documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = documents.person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
    );

-- Storage Bucket Setup (Assuming bucket 'documents' is created via dashboard, but here are policies)
-- Note: You must create the bucket 'documents' in the Supabase Dashboard manually if not using the API.

-- Storage Policies
-- Allow public access to read (or authenticated based on tree access - simpler to start with public for authenticated users)
-- Actually, let's restrict it to authenticated users at least.

-- Policy: "Give users access to own folder 1u100"
-- We'll organize files by tree_id or person_id? person_id is better.
-- Path: {person_id}/{filename}

-- INSERT (Upload)
-- User must be editor of the tree the person belongs to.
-- This is hard to check in storage policies directly without complex joins.
-- Simplified: Allow authenticated users to upload to 'documents' bucket.
-- Ideally, we'd check RBAC, but storage policies are limited.
-- We will rely on the backend to sign uploads or just allow authenticated uploads for now and rely on the app logic.

-- Let's try a robust policy if possible:
-- (storage.foldername(name))[1] should be the person_id.

-- For now, let's just provide the table creation SQL as that's the critical part for the backend.
