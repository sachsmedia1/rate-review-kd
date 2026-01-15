-- Add description fields to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS description_raw TEXT,
ADD COLUMN IF NOT EXISTS description_seo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.reviews.description_raw IS 'Rohe Stichpunkte/Kurzbeschreibung vom User';
COMMENT ON COLUMN public.reviews.description_seo IS 'KI-optimierte SEO-Beschreibung';