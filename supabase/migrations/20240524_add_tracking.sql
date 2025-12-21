-- Add Tracking Columns
alter table public.products 
add column if not exists tracking_number text,
add column if not exists courier_tracking text;

-- Add Index for Search
create index if not exists idx_products_tracking_number on public.products(tracking_number);
create index if not exists idx_products_courier_tracking on public.products(courier_tracking);
