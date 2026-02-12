-- Add identification_pattern field to courier_presets table
ALTER TABLE public.courier_presets 
ADD COLUMN IF NOT EXISTS identification_pattern TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.courier_presets.identification_pattern IS 'Pattern to identify courier from tracking number (e.g., "PP-", "TEMU-DO-"). Multiple patterns can be separated by comma.';

-- Update existing Pintopack record with pattern
UPDATE public.courier_presets 
SET identification_pattern = 'PP-,PINTO-' 
WHERE name = 'Pintopack' AND identification_pattern IS NULL;
