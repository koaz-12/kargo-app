-- Add store_tracking column to shipment_tracking table
-- Created to fix missing column error PGRST204

alter table public.shipment_tracking
add column if not exists store_tracking text;

-- Add index for easier searching
create index if not exists idx_shipment_tracking_store on shipment_tracking(store_tracking);
