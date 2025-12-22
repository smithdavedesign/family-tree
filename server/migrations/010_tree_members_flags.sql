-- Migration: Add is_favorite and is_archived to tree_members
-- Date: 2025-12-22

ALTER TABLE tree_members 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

ALTER TABLE tree_members 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Optional: Create an index for faster filtering if data grows large
-- CREATE INDEX idx_tree_members_user_flags ON tree_members(user_id) WHERE is_favorite = true OR is_archived = true;
