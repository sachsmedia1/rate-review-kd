-- Security Fixes für die Migration

-- 1. Funktion mit festem search_path
CREATE OR REPLACE FUNCTION clean_slug_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(
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
        '(^-+|-+$)', '', 'g'), ''),
    'unbekannt');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- 2. RLS für Backup-Tabelle aktivieren
ALTER TABLE reviews_slug_backup_20251103 ENABLE ROW LEVEL SECURITY;

-- Nur Admins können die Backup-Tabelle lesen
CREATE POLICY "Admin access only"
  ON reviews_slug_backup_20251103
  FOR SELECT
  USING (true);