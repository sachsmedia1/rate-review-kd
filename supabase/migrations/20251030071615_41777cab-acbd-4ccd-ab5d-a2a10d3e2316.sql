-- Add noindex control field to seo_settings table
ALTER TABLE seo_settings 
ADD COLUMN enable_indexing BOOLEAN DEFAULT true NOT NULL;

COMMENT ON COLUMN seo_settings.enable_indexing IS 
'Controls whether this subdomain should be indexed by search engines. 
Set to FALSE when WordPress plugin is primary SEO source to avoid duplicate content.';

-- Update existing row
UPDATE seo_settings 
SET enable_indexing = true 
WHERE id = '00000000-0000-0000-0000-000000000001';