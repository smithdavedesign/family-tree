-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'photo', 'story', 'person'
    resource_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_tree ON comments(tree_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Viewers can read comments on trees they have access to
DROP POLICY IF EXISTS "Users can view comments on trees they access" ON comments;
CREATE POLICY "Users can view comments on trees they access" ON comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tree_members
            WHERE tree_members.tree_id = comments.tree_id
            AND tree_members.user_id = auth.uid()
        )
    );

-- Editors and Owners can create comments
DROP POLICY IF EXISTS "Editors can create comments" ON comments;
CREATE POLICY "Editors can create comments" ON comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tree_members
            WHERE tree_members.tree_id = comments.tree_id
            AND tree_members.user_id = auth.uid()
            AND tree_members.role IN ('owner', 'editor', 'viewer')
        )
    );

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own comments, Owners can delete any comment
DROP POLICY IF EXISTS "Users can delete own comments, Owners delete all" ON comments;
CREATE POLICY "Users can delete own comments, Owners delete all" ON comments
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM tree_members
            WHERE tree_members.tree_id = comments.tree_id
            AND tree_members.user_id = auth.uid()
            AND tree_members.role = 'owner'
        )
    );

-- Create audit logging function for comments
CREATE OR REPLACE FUNCTION log_comment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
        VALUES (auth.uid(), 'CREATE', 'comment', NEW.id);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
        VALUES (auth.uid(), 'UPDATE', 'comment', NEW.id);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
        VALUES (auth.uid(), 'DELETE', 'comment', OLD.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit logging trigger
DROP TRIGGER IF EXISTS log_comments_changes ON comments;
CREATE TRIGGER log_comments_changes
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION log_comment_changes();
