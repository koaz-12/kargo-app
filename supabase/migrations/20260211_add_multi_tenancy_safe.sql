-- Migration: Add Multi-Tenancy Support (SAFE VERSION)
-- Only adds columns if they don't already exist

-- 1. Add user_id columns conditionally
DO $$ 
BEGIN
    -- Add to products (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add to platforms (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platforms' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE platforms ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add to purchase_accounts (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_accounts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE purchase_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add to monthly_goals (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'monthly_goals' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE monthly_goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Migrate existing data to first user
UPDATE products 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) 
WHERE user_id IS NULL;

UPDATE platforms 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) 
WHERE user_id IS NULL;

UPDATE purchase_accounts 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) 
WHERE user_id IS NULL;

UPDATE monthly_goals 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) 
WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL (only if column exists and has no nulls)
DO $$
BEGIN
    -- Products
    IF NOT EXISTS (SELECT 1 FROM products WHERE user_id IS NULL) THEN
        ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE products ALTER COLUMN user_id SET DEFAULT auth.uid();
    END IF;

    -- Platforms
    IF NOT EXISTS (SELECT 1 FROM platforms WHERE user_id IS NULL) THEN
        ALTER TABLE platforms ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE platforms ALTER COLUMN user_id SET DEFAULT auth.uid();
    END IF;

    -- Purchase Accounts
    IF NOT EXISTS (SELECT 1 FROM purchase_accounts WHERE user_id IS NULL) THEN
        ALTER TABLE purchase_accounts ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE purchase_accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
    END IF;

    -- Monthly Goals
    IF NOT EXISTS (SELECT 1 FROM monthly_goals WHERE user_id IS NULL) THEN
        ALTER TABLE monthly_goals ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE monthly_goals ALTER COLUMN user_id SET DEFAULT auth.uid();
    END IF;
END $$;
