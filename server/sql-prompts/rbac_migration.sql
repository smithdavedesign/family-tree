-- Update tree_members table to support role-based access control
-- This migration adds proper role support for collaboration features

-- First, check if the role column exists and has the right constraints
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tree_members_role_check' 
        AND table_name = 'tree_members'
    ) THEN
        ALTER TABLE public.tree_members DROP CONSTRAINT tree_members_role_check;
    END IF;
END $$;

-- Update the role column to support owner, editor, and viewer roles
ALTER TABLE public.tree_members 
    ALTER COLUMN role TYPE TEXT,
    ALTER COLUMN role SET NOT NULL;

-- Add new constraint with owner role
ALTER TABLE public.tree_members 
    ADD CONSTRAINT tree_members_role_check 
    CHECK (role IN ('owner', 'editor', 'viewer'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_tree_members_role ON public.tree_members(role);

-- Add a function to automatically add tree owner as a member with 'owner' role
CREATE OR REPLACE FUNCTION add_tree_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the tree owner as a member with 'owner' role
    INSERT INTO public.tree_members (tree_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (tree_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add owner when tree is created
DROP TRIGGER IF EXISTS trigger_add_tree_owner ON public.trees;
CREATE TRIGGER trigger_add_tree_owner
    AFTER INSERT ON public.trees
    FOR EACH ROW
    EXECUTE FUNCTION add_tree_owner_as_member();

-- Update RLS policies for tree_members
DROP POLICY IF EXISTS "Users can view tree members" ON public.tree_members;
CREATE POLICY "Users can view tree members" ON public.tree_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        tree_id IN (
            SELECT tree_id FROM public.tree_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only owners can add/remove members
DROP POLICY IF EXISTS "Owners can manage members" ON public.tree_members;
CREATE POLICY "Owners can manage members" ON public.tree_members
    FOR ALL USING (
        tree_id IN (
            SELECT tree_id FROM public.tree_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

COMMENT ON COLUMN public.tree_members.role IS 'User role: owner (full access), editor (can edit), viewer (read-only)';
