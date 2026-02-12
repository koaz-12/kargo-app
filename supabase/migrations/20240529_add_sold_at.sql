-- Add sold_at column to products table
alter table public.products 
add column if not exists sold_at timestamp with time zone;

-- Add index for filtering by sold_at date
create index if not exists idx_products_sold_at on public.products(sold_at);
