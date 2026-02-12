-- Add shipment_tracking table for courier tracking with weight
create table if not exists public.shipment_tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  tracking_number text not null,
  courier text not null,
  weight_kg decimal(10,2),
  weight_lb decimal(10,2),
  notes text,
  status text default 'PENDING' check (status in ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.shipment_tracking enable row level security;

-- RLS Policy: Users can CRUD their own tracking
create policy "Users can manage their own shipment tracking"
  on public.shipment_tracking
  for all
  using (auth.uid() = user_id);

-- Indices for performance
create index if not exists idx_shipment_tracking_user on shipment_tracking(user_id);
create index if not exists idx_shipment_tracking_number on shipment_tracking(tracking_number);
create index if not exists idx_shipment_tracking_created on shipment_tracking(created_at desc);

-- Updated_at trigger
create or replace function update_shipment_tracking_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shipment_tracking_updated_at
  before update on shipment_tracking
  for each row
  execute function update_shipment_tracking_updated_at();
