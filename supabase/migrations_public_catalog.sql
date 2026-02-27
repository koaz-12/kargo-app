-- Run this in your Supabase SQL Editor
-- This allows anyone to read a product, ONLY if the product status is 'RECEIVED'

CREATE POLICY "Allow anonymous read access to received products" 
ON public.products 
FOR SELECT 
USING (status = 'RECEIVED');
