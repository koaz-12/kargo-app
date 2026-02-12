-- Migration: Add Multi-Tenancy Support
-- Add user_id to all main tables for data isolation

-- 1. Add user_id columns
ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE platforms ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE purchase_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE monthly_goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Migrate existing data to first user (for backward compatibility)
-- If there are existing rows without user_id, assign them to the first user
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

-- 3. Make user_id NOT NULL
ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE platforms ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE purchase_accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE monthly_goals ALTER COLUMN user_id SET NOT NULL;

-- 4. Add default for new inserts (uses current authenticated user)
ALTER TABLE products ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE platforms ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE purchase_accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE monthly_goals ALTER COLUMN user_id SET DEFAULT auth.uid();
