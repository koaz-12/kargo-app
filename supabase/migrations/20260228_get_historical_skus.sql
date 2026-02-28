-- Migration: Add function to retrieve unique historical SKUs for a given product name
-- This enables the "Smart Autocomplete" feature for the SKU input field.

CREATE OR REPLACE FUNCTION get_historical_skus(search_name text)
RETURNS TABLE (sku text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.sku
  FROM products p
  WHERE p.sku IS NOT NULL 
    AND p.sku != ''
    -- Case-insensitive match on product name
    AND lower(p.name) = lower(search_name)
    -- Multi-tenant security based on current authenticated user
    AND p.user_id = auth.uid()
  ORDER BY p.sku ASC
  LIMIT 10;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_historical_skus(text) TO authenticated;
