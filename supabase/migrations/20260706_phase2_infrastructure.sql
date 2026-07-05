-- ====================================================================
-- Phase 2 Infrastructure: Activity Logs and Workspaces
-- ====================================================================

-- 1. Create Workspaces Table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Owners can see and manage their workspaces
CREATE POLICY "Users can view own workspaces" 
    ON workspaces FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update own workspaces" 
    ON workspaces FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own workspaces" 
    ON workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 2. Create Team Members Table (Roles)
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'assistant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can see themselves and other members of their workspace
CREATE POLICY "Members can view workspace members" 
    ON workspace_members FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Only owners can invite/remove members
CREATE POLICY "Owners can insert workspace members" 
    ON workspace_members FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can delete workspace members" 
    ON workspace_members FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- 3. Create Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., 'created', 'updated', 'deleted', 'sold'
    entity_type TEXT NOT NULL, -- e.g., 'product', 'platform', 'adjustment'
    entity_name TEXT NOT NULL, -- The name of the item
    details JSONB, -- Additional info (e.g. { "old_stock": 5, "new_stock": 4 })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace activity" 
    ON activity_logs FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Members can insert activity" 
    ON activity_logs FOR INSERT WITH CHECK (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

-- 4. Automatically create a workspace for every user
-- (For existing users)
DO $$
DECLARE
    u RECORD;
    w_id UUID;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        -- Create a default workspace for each user
        INSERT INTO workspaces (owner_id, name) VALUES (u.id, 'Mi Inventario') RETURNING id INTO w_id;
        
        -- Add them as owner in workspace_members
        INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (w_id, u.id, 'owner');
    END LOOP;
END $$;

-- 5. Adapt Existing Tables to Use Workspaces
-- We will add workspace_id to all tables.
ALTER TABLE products ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE platforms ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE purchase_accounts ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE monthly_goals ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE storage_locations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE adjustment_types ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Migrate existing data to the owner's default workspace
UPDATE products p SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = p.user_id LIMIT 1);
UPDATE platforms p SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = p.user_id LIMIT 1);
UPDATE purchase_accounts p SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = p.user_id LIMIT 1);
UPDATE monthly_goals m SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = m.user_id LIMIT 1);
UPDATE storage_locations s SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = s.user_id LIMIT 1);
UPDATE adjustment_types a SET workspace_id = (SELECT id FROM workspaces w WHERE w.owner_id = a.user_id LIMIT 1);

-- Note: user_id is kept to know WHO originally created the item, but workspace_id controls WHO CAN SEE IT.

-- 6. Update RLS Policies to use workspace_id instead of user_id for SELECT/UPDATE/DELETE
-- Drop old policies for Products
DROP POLICY IF EXISTS "Users can manage their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

-- New Workspace Policies for Products
CREATE POLICY "Members can view workspace products" ON products FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can insert workspace products" ON products FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can update workspace products" ON products FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can delete workspace products" ON products FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner')
);
