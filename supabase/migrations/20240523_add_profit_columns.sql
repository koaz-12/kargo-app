-- Add calculated financial columns to products table
ALTER TABLE public.products
ADD COLUMN net_cost numeric(10, 2) DEFAULT 0,
ADD COLUMN gross_profit numeric(10, 2) DEFAULT 0,
ADD COLUMN margin numeric(5, 2) DEFAULT 0,
ADD COLUMN roi numeric(5, 2) DEFAULT 0;
