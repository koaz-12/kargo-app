-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Platforms Table
create table public.platforms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('TEMU', 'AMAZON', 'ALIEXPRESS', 'SHEIN', 'OTHER')),
  fee_structure_type text default 'STANDARD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  platform_id uuid references public.platforms(id) on delete set null,
  name text not null,
  sku text,
  buy_price numeric(10, 2) not null default 0,
  shipping_cost numeric(10, 2) not null default 0,
  origin_tax numeric(10, 2) DEFAULT 0.00, -- US Sales Tax / Platform Fee
  tax_cost numeric(10, 2) not null default 0,
  sale_price numeric(10, 2),
  local_shipping_cost numeric(10, 2) default 0,
  exchange_rate numeric(10, 2) default 1.0, -- USD to Local Currency Rate
  status text default 'ORDERED', -- ORDERED, RECEIVED, SOLD
  currency text default 'USD',
  image_url text, -- Scraped Image URL
  product_url text, -- Link to Original Product
  sold_at timestamp with time zone, -- Date when product was sold
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial Adjustments Table (The key for credits/refunds)
create table public.financial_adjustments (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  type text not null check (type in ('CREDIT_CLAIM', 'REWARD_BACK', 'PRICE_ADJUSTMENT', 'COUPON', 'OTHER')),
  amount numeric(10, 2) not null, -- Positive = Credit (Reduces Cost), Negative = Charge (Increases Cost)
  percentage numeric(5, 2), -- User input percentage helper
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_products_platform on public.products(platform_id);
create index idx_adjustments_product on public.financial_adjustments(product_id);
create index idx_adjustments_type on public.financial_adjustments(type);

-- RLS (Row Level Security) - Basic Setup (Open for now, should be locked down in production)
alter table public.platforms enable row level security;
alter table public.products enable row level security;
alter table public.financial_adjustments enable row level security;

create policy "Enable read access for all users" on public.platforms for select using (true);
create policy "Enable read access for all users" on public.products for select using (true);
create policy "Enable insert for all users" on public.products for insert with check (true);
create policy "Enable read access for all users" on public.financial_adjustments for select using (true);
create policy "Enable insert for all users" on public.financial_adjustments for insert with check (true);

-- Phase 14: Monthly Goals
create table public.monthly_goals (
  id uuid default uuid_generate_v4() primary key,
  month_key text not null, -- Format: 'YYYY-MM'
  target_amount numeric(10, 2) not null default 50000.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(month_key)
);

-- RLS for Monthly Goals
alter table public.monthly_goals enable row level security;
create policy "Enable read access for all users" on public.monthly_goals for select using (true);
create policy "Enable insert/update for all users" on public.monthly_goals for all using (true) with check (true);
