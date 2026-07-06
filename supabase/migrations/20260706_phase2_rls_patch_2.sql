-- ====================================================================
-- Phase 2 Infrastructure Patch 2: Schema Reload & RLS Fixes
-- ====================================================================

-- Reload PostgREST schema cache to fix 406 Not Acceptable errors
NOTIFY pgrst, 'reload schema';

-- 1. Platforms
DROP POLICY IF EXISTS "Users can view their own platforms" ON platforms;
DROP POLICY IF EXISTS "Users can insert their own platforms" ON platforms;
DROP POLICY IF EXISTS "Users can update their own platforms" ON platforms;
DROP POLICY IF EXISTS "Users can delete their own platforms" ON platforms;
DROP POLICY IF EXISTS "Users can manage their own platforms" ON platforms;

CREATE POLICY "Members can view workspace platforms" ON platforms FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can insert workspace platforms" ON platforms FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can update workspace platforms" ON platforms FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Owners can delete workspace platforms" ON platforms FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- 2. Purchase Accounts
DROP POLICY IF EXISTS "Users can view their own purchase accounts" ON purchase_accounts;
DROP POLICY IF EXISTS "Users can manage their own purchase accounts" ON purchase_accounts;

CREATE POLICY "Members can view workspace accounts" ON purchase_accounts FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can insert workspace accounts" ON purchase_accounts FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can update workspace accounts" ON purchase_accounts FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Owners can delete workspace accounts" ON purchase_accounts FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- 3. Monthly Goals
DROP POLICY IF EXISTS "Users can manage their own monthly goals" ON monthly_goals;

CREATE POLICY "Members can view workspace goals" ON monthly_goals FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can insert workspace goals" ON monthly_goals FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can update workspace goals" ON monthly_goals FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Owners can delete workspace goals" ON monthly_goals FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- 4. Storage Locations
DROP POLICY IF EXISTS "Users can view their own storage locations" ON storage_locations;
DROP POLICY IF EXISTS "Users can manage their own storage locations" ON storage_locations;

CREATE POLICY "Members can view workspace locations" ON storage_locations FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can insert workspace locations" ON storage_locations FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can update workspace locations" ON storage_locations FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Owners can delete workspace locations" ON storage_locations FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- 5. Adjustment Types
DROP POLICY IF EXISTS "Users can view their own adjustment types" ON adjustment_types;
DROP POLICY IF EXISTS "Users can manage their own adjustment types" ON adjustment_types;

CREATE POLICY "Members can view workspace adj types" ON adjustment_types FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can insert workspace adj types" ON adjustment_types FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Members can update workspace adj types" ON adjustment_types FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
CREATE POLICY "Owners can delete workspace adj types" ON adjustment_types FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));
