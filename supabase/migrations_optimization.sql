-- Optimizations for Search and Filtering

-- 1. Index on Product Name for faster search (ILIKE)
-- Using pg_trgm extension is best for text search, but standard btree works for prefix like 'Name%'
-- For simple 'ILIKE %term%', we usually need a GIN index with pg_trgm.
-- But since we can't easily enable extensions without admin rights in some setups, we'll assume basic indexes for now or standard btree for sorting.

create index if not exists idx_products_user_id on products(user_id);
create index if not exists idx_products_created_on on products(created_at desc);

-- 2. Index on Purchase Accounts for foreign key lookups
create index if not exists idx_products_purchase_account on products(purchase_account_id);

-- Optional: Enable pg_trgm if possible for "Fuzzy Search"
-- create extension if not exists pg_trgm;
-- create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);
