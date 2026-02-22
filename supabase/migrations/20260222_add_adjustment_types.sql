-- Migration: Add adjustment_types table
-- Allows users to manage credit/discount types used in financial adjustments

CREATE TABLE IF NOT EXISTS public.adjustment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    affects_cost BOOLEAN NOT NULL DEFAULT true,
    is_built_in BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE public.adjustment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own adjustment types"
    ON public.adjustment_types FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adjustment types"
    ON public.adjustment_types FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adjustment types"
    ON public.adjustment_types FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom adjustment types"
    ON public.adjustment_types FOR DELETE
    USING (auth.uid() = user_id AND is_built_in = false);
