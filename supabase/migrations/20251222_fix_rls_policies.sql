-- Enable Update and Delete for Products
create policy "Enable update for all users" on public.products for update using (true) with check (true);
create policy "Enable delete for all users" on public.products for delete using (true);

-- Enable Update and Delete for Financial Adjustments
create policy "Enable update for all users" on public.financial_adjustments for update using (true) with check (true);
create policy "Enable delete for all users" on public.financial_adjustments for delete using (true);

-- Enable Update and Delete for Product Images
-- Note: product_images table creation was not in the viewed schema.sql but implied. Using 'if exists' safety or just adding policy assuming table exists.
-- Checking if product_images RLS is enabled.

alter table public.product_images enable row level security;

create policy "Enable all access for all users" on public.product_images for all using (true) with check (true);
