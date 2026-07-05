-- Add new columns to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_platform TEXT DEFAULT 'TEMU';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_expected_margin NUMERIC DEFAULT 30;

-- Create avatars bucket if it doesn't exist (Requires superuser/storage admin)
-- Run this in the Supabase SQL Editor manually if the bucket 'avatars' doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 'avatars' bucket
-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
CREATE POLICY "Auth Users Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update own avatar" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete own avatar" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
