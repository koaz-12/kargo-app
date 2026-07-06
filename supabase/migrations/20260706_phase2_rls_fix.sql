-- ====================================================================
-- Phase 2 Infrastructure Patch: Fix RLS Infinite Recursion
-- ====================================================================

-- 1. Create a helper function that runs WITHOUT RLS (SECURITY DEFINER)
-- This avoids the infinite recursion when checking memberships
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY 
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix workspace_members policy to use the helper function
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
CREATE POLICY "Members can view workspace members" 
    ON workspace_members FOR SELECT USING (
        workspace_id IN (SELECT public.get_user_workspace_ids())
    );

DROP POLICY IF EXISTS "Owners can insert workspace members" ON workspace_members;
CREATE POLICY "Owners can insert workspace members" 
    ON workspace_members FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Owners can delete workspace members" ON workspace_members;
CREATE POLICY "Owners can delete workspace members" 
    ON workspace_members FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- 3. Fix products policy
DROP POLICY IF EXISTS "Members can view workspace products" ON products;
CREATE POLICY "Members can view workspace products" ON products FOR SELECT USING (
    workspace_id IN (SELECT public.get_user_workspace_ids())
);

DROP POLICY IF EXISTS "Members can insert workspace products" ON products;
CREATE POLICY "Members can insert workspace products" ON products FOR INSERT WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspace_ids())
);

DROP POLICY IF EXISTS "Members can update workspace products" ON products;
CREATE POLICY "Members can update workspace products" ON products FOR UPDATE USING (
    workspace_id IN (SELECT public.get_user_workspace_ids())
);

DROP POLICY IF EXISTS "Members can delete workspace products" ON products;
CREATE POLICY "Members can delete workspace products" ON products FOR DELETE USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- 4. Fix activity_logs policy
DROP POLICY IF EXISTS "Members can view workspace activity" ON activity_logs;
CREATE POLICY "Members can view workspace activity" ON activity_logs FOR SELECT USING (
    workspace_id IN (SELECT public.get_user_workspace_ids())
);

DROP POLICY IF EXISTS "Members can insert activity" ON activity_logs;
CREATE POLICY "Members can insert activity" ON activity_logs FOR INSERT WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspace_ids())
);
