-- Migration: Performance Optimization Indices
-- Add indices for frequently queried columns

-- ============================================
-- 1. PRODUCTS TABLE INDICES
-- ============================================

-- Index for filtering by status (ORDERED, RECEIVED, SOLD)
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Index for filtering by sold_at date (for monthly stats)
CREATE INDEX IF NOT EXISTS idx_products_sold_at ON products(sold_at) WHERE sold_at IS NOT NULL;

-- Index for multi-tenancy queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Composite index for common query pattern: user + status
CREATE INDEX IF NOT EXISTS idx_products_user_status ON products(user_id, status);

-- Composite index for user + sold_at (for stats queries)
CREATE INDEX IF NOT EXISTS idx_products_user_sold_at ON products(user_id, sold_at) WHERE sold_at IS NOT NULL;

-- ============================================
-- 2. PLATFORMS TABLE INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_platforms_user_id ON platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_platforms_type ON platforms(type);

-- ============================================
-- 3. PURCHASE ACCOUNTS TABLE INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_purchase_accounts_user_id ON purchase_accounts(user_id);

-- ============================================
-- 4. MONTHLY GOALS TABLE INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_id ON monthly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_month_key ON monthly_goals(month_key);

-- Composite index for user + month (unique lookups)
CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_month ON monthly_goals(user_id, month_key);

-- ============================================
-- 5. FINANCIAL ADJUSTMENTS TABLE INDICES
-- ============================================
-- Already has idx_adjustments_product and idx_adjustments_type from schema.sql
-- Add composite index for product + type queries

CREATE INDEX IF NOT EXISTS idx_adjustments_product_type ON financial_adjustments(product_id, type);

-- ============================================
-- 6. PRODUCT IMAGES TABLE INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);
