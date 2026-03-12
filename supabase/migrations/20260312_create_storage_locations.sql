-- Storage Locations (Personas/Lugares donde se almacenan artículos)
create table if not exists public.storage_locations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agregar columna de ubicación a productos
alter table public.products add column if not exists storage_location_id uuid references public.storage_locations(id) on delete set null;

-- Índices
create index if not exists idx_storage_locations_user on public.storage_locations(user_id);
create index if not exists idx_products_storage_location on public.products(storage_location_id);

-- RLS
alter table public.storage_locations enable row level security;
create policy "Users can view own storage locations" on public.storage_locations for select using (auth.uid() = user_id);
create policy "Users can insert own storage locations" on public.storage_locations for insert with check (auth.uid() = user_id);
create policy "Users can update own storage locations" on public.storage_locations for update using (auth.uid() = user_id);
create policy "Users can delete own storage locations" on public.storage_locations for delete using (auth.uid() = user_id);
