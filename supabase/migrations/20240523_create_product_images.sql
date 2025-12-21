-- Create product_images table to support multiple images per product
create table if not exists product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade not null,
  storage_path text not null,
  display_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table product_images enable row level security;

-- Policies (Public Read, Authenticated Write)
create policy "Public read access"
  on product_images for select
  using ( true );

create policy "Authenticated insert"
  on product_images for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated delete"
  on product_images for delete
  using ( auth.role() = 'authenticated' );
