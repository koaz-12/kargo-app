create table public.marketplace_listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10, 2) not null default 0,
  tags text[], -- Array of strings for tags
  image_urls text[], -- Array of strings for images
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.marketplace_listings enable row level security;
create policy "Enable full access for users based on user_id" on public.marketplace_listings for all using (auth.uid() = user_id);

-- Indexes
create index idx_marketplace_listings_user on public.marketplace_listings(user_id);
