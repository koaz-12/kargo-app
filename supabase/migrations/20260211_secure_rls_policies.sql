-- Migration: Secure RLS Policies
-- Replace open policies with user-based security

-- ============================================
-- 1. DROP OLD INSECURE POLICIES
-- ============================================

-- Products
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;

-- Platforms
DROP POLICY IF EXISTS "Enable read access for all users" ON platforms;

-- Purchase Accounts (if exists)
DROP POLICY IF EXISTS "Enable read access for all users" ON purchase_accounts;

-- Financial Adjustments
DROP POLICY IF EXISTS "Enable read access for all users" ON financial_adjustments;
DROP POLICY IF EXISTS "Enable insert for all users" ON financial_adjustments;

-- Monthly Goals
DROP POLICY IF EXISTS "Enable read access for all users" ON monthly_goals;
DROP POLICY IF EXISTS "Enable insert/update for all users" ON monthly_goals;

-- ============================================
-- 2. CREATE SECURE POLICIES - PRODUCTS
-- ============================================

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. CREATE SECURE POLICIES - PLATFORMS
-- ============================================

CREATE POLICY "Users can view own platforms"
  ON platforms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platforms"
  ON platforms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platforms"
  ON platforms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own platforms"
  ON platforms FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. CREATE SECURE POLICIES - PURCHASE ACCOUNTS
-- ============================================

CREATE POLICY "Users can view own purchase accounts"
  ON purchase_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase accounts"
  ON purchase_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase accounts"
  ON purchase_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchase accounts"
  ON purchase_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE SECURE POLICIES - MONTHLY GOALS
-- ============================================

CREATE POLICY "Users can view own monthly goals"
  ON monthly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly goals"
  ON monthly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly goals"
  ON monthly_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly goals"
  ON monthly_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. CREATE SECURE POLICIES - FINANCIAL ADJUSTMENTS
-- ============================================
-- Financial adjustments belong to products, so check ownership through product

CREATE POLICY "Users can view own financial adjustments"
  ON financial_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = financial_adjustments.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own financial adjustments"
  ON financial_adjustments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = financial_adjustments.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own financial adjustments"
  ON financial_adjustments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = financial_adjustments.product_id 
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = financial_adjustments.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own financial adjustments"
  ON financial_adjustments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = financial_adjustments.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. CREATE SECURE POLICIES - PRODUCT IMAGES
-- ============================================
-- Product images belong to products, check ownership through product

CREATE POLICY "Users can view own product images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product images"
  ON product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own product images"
  ON product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own product images"
  ON product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );
