-- Create courier_presets table for managing favorite/default couriers
CREATE TABLE IF NOT EXISTS public.courier_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.courier_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own couriers
CREATE POLICY "Users can manage their own courier presets"
  ON public.courier_presets
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_courier_presets_user_id ON courier_presets(user_id);

-- Create index for is_default
CREATE INDEX IF NOT EXISTS idx_courier_presets_default ON courier_presets(user_id, is_default);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_courier_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_courier_presets_updated_at
  BEFORE UPDATE ON courier_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_courier_presets_updated_at();

-- Insert default couriers for existing users (optional)
-- This will add Pintopack as default for all users
INSERT INTO public.courier_presets (user_id, name, is_default, display_order)
SELECT 
  id as user_id,
  'Pintopack' as name,
  true as is_default,
  1 as display_order
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM courier_presets WHERE user_id = auth.users.id
);
