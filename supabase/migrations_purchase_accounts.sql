-- 1. Create Table for Accounts
create table if not exists purchase_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Security
alter table purchase_accounts enable row level security;

drop policy if exists "Users can manage their own purchase accounts" on purchase_accounts;

create policy "Users can manage their own purchase accounts"
on purchase_accounts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. Link to Products
-- (Safe to run multiple times, 'if not exists' handles it)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'purchase_account_id') then
        alter table products add column purchase_account_id uuid references purchase_accounts(id);
    end if;
end $$;
