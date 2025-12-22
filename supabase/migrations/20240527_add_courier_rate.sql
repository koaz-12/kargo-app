-- Add default_courier_discount to user_preferences
-- This stores the percentage discount user gets from their courier (e.g., 10%)
alter table public.user_preferences 
add column if not exists default_courier_discount numeric(5, 2) default 10.0;
