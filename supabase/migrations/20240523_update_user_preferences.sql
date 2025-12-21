-- Add explicit columns for core preferences
alter table public.user_preferences 
add column default_platform_id uuid references public.platforms(id) on delete set null,
add column default_exchange_rate numeric(10, 2);
