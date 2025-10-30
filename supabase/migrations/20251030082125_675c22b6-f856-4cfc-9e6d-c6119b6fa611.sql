-- ============================================================================
-- SQL MIGRATION: Company Info Fields Update
-- ============================================================================
-- 
-- CHANGES:
--   - REMOVE: social_linkedin column
--   - REMOVE: company_founded_year column
--   - ADD: social_pinterest column
--
-- ============================================================================

-- Add Pinterest column
ALTER TABLE seo_settings 
ADD COLUMN IF NOT EXISTS social_pinterest TEXT;

-- Remove LinkedIn column
ALTER TABLE seo_settings 
DROP COLUMN IF EXISTS social_linkedin;

-- Remove founded_year column
ALTER TABLE seo_settings 
DROP COLUMN IF EXISTS company_founded_year;

-- Verify changes
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'seo_settings' 
  AND column_name IN ('social_pinterest', 'social_linkedin', 'company_founded_year')
ORDER BY column_name;