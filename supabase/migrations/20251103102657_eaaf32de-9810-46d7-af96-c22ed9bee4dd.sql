-- ============================================================================
-- QUICK MIGRATION - Alle Schritte in einem
-- ============================================================================
-- Betrifft: 5.014 von 5.945 Bewertungen
-- ============================================================================

-- 1. Backup erstellen
DROP TABLE IF EXISTS reviews_slug_backup_20251103;
CREATE TABLE reviews_slug_backup_20251103 AS
SELECT id, slug as old_slug, customer_firstname, customer_lastname, city, 
       product_category, installation_date, is_published, created_at
FROM reviews
WHERE slug ~ '-\d{7}$';

-- 2. Text-Bereinigung Funktion
CREATE OR REPLACE FUNCTION clean_slug_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(
    regexp_replace(
      regexp_replace(
        lower(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(COALESCE(text_input, ''), 'ä', 'ae', 'g'),
                'ö', 'oe', 'g'),
              'ü', 'ue', 'g'),
            'ß', 'ss', 'g')
        ),
        '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Temporäre Tabelle mit neuen Slugs
DROP TABLE IF EXISTS temp_new_slugs;
CREATE TEMP TABLE temp_new_slugs AS
WITH base_slugs AS (
  SELECT id, slug as old_slug,
    clean_slug_text(product_category) || '-' ||
    clean_slug_text(customer_lastname) || '-' ||
    clean_slug_text(city) || '-' ||
    EXTRACT(YEAR FROM installation_date)::text as base_slug,
    created_at
  FROM reviews
  WHERE slug ~ '-\d{7}$'
),
slug_groups AS (
  SELECT id, old_slug, base_slug, created_at,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY created_at ASC) as rn,
    COUNT(*) OVER (PARTITION BY base_slug) as group_count
  FROM base_slugs
)
SELECT id, old_slug,
  CASE 
    WHEN group_count = 1 THEN base_slug
    WHEN rn = 1 THEN base_slug
    ELSE base_slug || '-' || rn
  END as new_slug
FROM slug_groups;

-- 4. UPDATE (Transaction)
UPDATE reviews r
SET slug = t.new_slug, updated_at = NOW()
FROM temp_new_slugs t
WHERE r.id = t.id;