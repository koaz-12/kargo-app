-- Migration: Add category column to adjustment_types
-- 'CREDIT'   = money held in platform account (credits, rewards, claims)
-- 'DISCOUNT' = applied at purchase, reduces actual amount paid (coupons, price adjustments)

ALTER TABLE public.adjustment_types
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'CREDIT'
    CHECK (category IN ('CREDIT', 'DISCOUNT'));
