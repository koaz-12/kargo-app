-- Add financial columns to products table to store calculated profitability metrics
alter table public.products 
add column if not exists net_cost numeric(10, 2) default 0,
add column if not exists gross_profit numeric(10, 2) default 0,
add column if not exists margin numeric(10, 2) default 0,
add column if not exists roi numeric(10, 2) default 0;
