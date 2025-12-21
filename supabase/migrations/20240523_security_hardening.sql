-- 1. Add user_id to tables
alter table public.platforms add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.products add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.financial_adjustments add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.monthly_goals add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.purchase_accounts add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.product_images add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2. Update RLS Policies (Drop unsafe ones first)

-- Platforms
drop policy if exists "Enable read access for all users" on public.platforms;
create policy "Users can view own platforms" on public.platforms for select using (auth.uid() = user_id);
create policy "Users can insert own platforms" on public.platforms for insert with check (auth.uid() = user_id);
create policy "Users can delete own platforms" on public.platforms for delete using (auth.uid() = user_id);

-- Products
drop policy if exists "Enable read access for all users" on public.products;
drop policy if exists "Enable insert for all users" on public.products;
create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Financial Adjustments
drop policy if exists "Enable read access for all users" on public.financial_adjustments;
drop policy if exists "Enable insert for all users" on public.financial_adjustments;
create policy "Users can view own adjustments" on public.financial_adjustments for select using (auth.uid() = user_id);
create policy "Users can insert own adjustments" on public.financial_adjustments for insert with check (auth.uid() = user_id);
create policy "Users can delete own adjustments" on public.financial_adjustments for delete using (auth.uid() = user_id);

-- Monthly Goals
drop policy if exists "Enable read access for all users" on public.monthly_goals;
drop policy if exists "Enable insert/update for all users" on public.monthly_goals;
create policy "Users can view own goals" on public.monthly_goals for select using (auth.uid() = user_id);
create policy "Users can insert/update own goals" on public.monthly_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Purchase Accounts
drop policy if exists "Enable read access for all users" on public.purchase_accounts;
create policy "Users can view own accounts" on public.purchase_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.purchase_accounts for insert with check (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.purchase_accounts for delete using (auth.uid() = user_id);

-- Product Images
drop policy if exists "Public read access" on public.product_images;
create policy "Users can view own images" on public.product_images for select using (auth.uid() = user_id);
-- (Insert/Delete policies usually already check auth.role()='authenticated', but explicit user_id check is better)
drop policy if exists "Authenticated insert" on public.product_images;
create policy "Users can insert own images" on public.product_images for insert with check (auth.uid() = user_id);
drop policy if exists "Authenticated delete" on public.product_images;
create policy "Users can delete own images" on public.product_images for delete using (auth.uid() = user_id);
