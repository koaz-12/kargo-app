-- Modificar la tabla marketplace_listings para soportar múltiples SKUs en lugar de uno solo
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS skus text[] DEFAULT '{}';

-- Migrar datos existentes (si la columna sku anterior existía y tenía datos)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='marketplace_listings' AND column_name='sku'
    ) THEN
        UPDATE public.marketplace_listings
        SET skus = ARRAY[sku]
        WHERE sku IS NOT NULL AND sku != '';
    END IF;
END $$;

-- Eliminar la columna vieja y su índice, y crear el nuevo índice GIN para búsquedas eficientes en el array
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='marketplace_listings' AND column_name='sku'
    ) THEN
        DROP INDEX IF EXISTS idx_marketplace_listings_sku;
        ALTER TABLE public.marketplace_listings DROP COLUMN sku;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_skus ON public.marketplace_listings USING GIN (skus);
