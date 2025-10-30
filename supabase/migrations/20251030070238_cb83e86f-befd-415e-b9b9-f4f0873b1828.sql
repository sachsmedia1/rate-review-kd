-- Fix function search_path for update_seo_settings_updated_at
CREATE OR REPLACE FUNCTION update_seo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;