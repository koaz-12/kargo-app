-- Add tracking_type column to shipment_tracking table
ALTER TABLE public.shipment_tracking 
ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'BUSINESS' 
CHECK (tracking_type IN ('PERSONAL', 'BUSINESS'));

-- Add index for tracking_type
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_type ON shipment_tracking(tracking_type);
