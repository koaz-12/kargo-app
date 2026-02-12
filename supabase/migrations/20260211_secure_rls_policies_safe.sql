-- Migration: Secure RLS Policies (SAFE VERSION)
-- Drops ALL existing policies and creates new secure ones

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Get all policies for our tables and drop them
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies for products
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'products'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON products', pol.policyname);
    END LOOP;

    -- Drop all policies for platforms
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'platforms'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON platforms', pol.policyname);
    END LOOP;

    -- Drop all policies for purchase_accounts
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'purchase_accounts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON purchase_accounts', pol.policyname);
    END LOOP;

    -- Drop all policies for monthly_goals
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'monthly_goals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON monthly_goals', pol.policyname);
    END LOOP;

    -- Drop all policies for financial_adjustments
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'financial_adjustments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON financial_adjustments', pol.policyname);
    END LOOP;

    -- Drop all policies for product_images
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'product_images'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON product_images', pol.policyname);
    END LOOP;
END $$;

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
