-- Create invitations table for tracking pending invites
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    token TEXT NOT NULL UNIQUE, -- Unique code for the invite link
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tree_id ON public.invitations(tree_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Tree owners and editors can view invitations for their trees
CREATE POLICY "Tree members can view invitations" ON public.invitations
    FOR SELECT USING (
        tree_id IN (
            SELECT tree_id FROM public.tree_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- Policy: Tree owners and editors can create invitations
CREATE POLICY "Tree members can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        tree_id IN (
            SELECT tree_id FROM public.tree_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- Policy: Tree owners can delete invitations
CREATE POLICY "Tree owners can delete invitations" ON public.invitations
    FOR DELETE USING (
        tree_id IN (
            SELECT tree_id FROM public.tree_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Ensure is_public column exists on trees table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trees' AND column_name = 'is_public') THEN
        ALTER TABLE public.trees ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

COMMENT ON TABLE public.invitations IS 'Tracks share links and invitations for trees';
