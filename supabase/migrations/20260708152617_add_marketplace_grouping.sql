-- Add grouping and inventory linking capabilities to marketplace templates
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS group_id uuid,
ADD COLUMN IF NOT EXISTS sku text;

-- Add index for faster lookups by group_id and sku
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_group_id ON public.marketplace_listings(group_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_sku ON public.marketplace_listings(sku);
