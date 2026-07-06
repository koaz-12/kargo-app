-- ====================================================================
-- Phase 6 & Phase 4.2: Operating Expenses & Returns
-- ====================================================================

-- 1. Operating Expenses (OPEX)
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('MARKETING', 'PACKAGING', 'SHIPPING', 'SOFTWARE', 'SALARY', 'OTHER')),
    amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace expenses" ON public.operating_expenses
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE OR REPLACE FUNCTION set_expense_workspace()
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

CREATE TRIGGER tr_set_expense_workspace
    BEFORE INSERT ON public.operating_expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_workspace();


-- 2. Returns (RMA)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    reason TEXT,
    refund_amount NUMERIC NOT NULL DEFAULT 0,
    returned_to_inventory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace returns" ON public.returns
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE OR REPLACE FUNCTION set_return_workspace()
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

CREATE TRIGGER tr_set_return_workspace
    BEFORE INSERT ON public.returns
    FOR EACH ROW
    EXECUTE FUNCTION set_return_workspace();

-- 3. Update Product Status Enum to allow 'RETURNED'
-- (PostgreSQL check constraint update might be tricky if it's text, let's assume it's just TEXT field in our products schema)
-- Wait, in our schema `products.status` is a TEXT field. We enforce status in TS but let's make sure there's no DB constraint blocking 'RETURNED'.
-- In previous migrations, we didn't add a CHECK constraint to products.status.

NOTIFY pgrst, 'reload schema';
