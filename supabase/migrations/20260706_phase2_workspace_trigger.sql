-- ====================================================================
-- Phase 2 Infrastructure Patch: Auto-assign Workspace ID
-- ====================================================================

-- Function to auto-assign the active user's workspace on insert
CREATE OR REPLACE FUNCTION public.assign_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        SELECT workspace_id INTO NEW.workspace_id 
        FROM public.workspace_members 
        WHERE user_id = auth.uid() 
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to all relevant tables
DROP TRIGGER IF EXISTS ensure_workspace_products ON products;
CREATE TRIGGER ensure_workspace_products BEFORE INSERT ON products 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();

DROP TRIGGER IF EXISTS ensure_workspace_platforms ON platforms;
CREATE TRIGGER ensure_workspace_platforms BEFORE INSERT ON platforms 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();

DROP TRIGGER IF EXISTS ensure_workspace_accounts ON purchase_accounts;
CREATE TRIGGER ensure_workspace_accounts BEFORE INSERT ON purchase_accounts 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();

DROP TRIGGER IF EXISTS ensure_workspace_goals ON monthly_goals;
CREATE TRIGGER ensure_workspace_goals BEFORE INSERT ON monthly_goals 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();

DROP TRIGGER IF EXISTS ensure_workspace_locations ON storage_locations;
CREATE TRIGGER ensure_workspace_locations BEFORE INSERT ON storage_locations 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();

DROP TRIGGER IF EXISTS ensure_workspace_adj_types ON adjustment_types;
CREATE TRIGGER ensure_workspace_adj_types BEFORE INSERT ON adjustment_types 
FOR EACH ROW EXECUTE FUNCTION public.assign_default_workspace();
