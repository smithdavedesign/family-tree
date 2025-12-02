-- Fix infinite recursion in tree_members RLS policy

-- 1. Create a secure function to check tree membership without triggering RLS
-- This function runs with SECURITY DEFINER, meaning it bypasses RLS on the tables it queries.
CREATE OR REPLACE FUNCTION get_user_tree_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT tree_id FROM public.tree_members WHERE user_id = user_uuid;
$$;

-- 2. Update the tree_members policy to use this function instead of a direct subquery
DROP POLICY IF EXISTS "Users can view tree members" ON public.tree_members;

CREATE POLICY "Users can view tree members" ON public.tree_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        tree_id IN (
            SELECT get_user_tree_ids(auth.uid())
        )
    );

-- 3. Ensure the function is accessible
GRANT EXECUTE ON FUNCTION get_user_tree_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tree_ids(uuid) TO service_role;
