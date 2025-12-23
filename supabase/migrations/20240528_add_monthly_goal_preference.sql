-- Add default_monthly_goal to user_preferences
alter table public.user_preferences 
add column if not exists default_monthly_goal numeric(10, 2) default 50000;
