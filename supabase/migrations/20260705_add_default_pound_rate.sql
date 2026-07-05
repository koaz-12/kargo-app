-- Add default_pound_rate to user_preferences
-- This stores the default cost per pound for courier shipping (e.g., 280)
alter table public.user_preferences 
add column if not exists default_pound_rate numeric(10, 2) default 280.00;
