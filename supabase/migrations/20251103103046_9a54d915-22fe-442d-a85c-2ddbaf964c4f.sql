-- Sicherheitskorrekturen für die Slug-Migration

-- 1. Search Path für clean_slug_text Funktion setzen
CREATE OR REPLACE FUNCTION clean_slug_text(text_input TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 2. RLS für Backup-Tabelle aktivieren
ALTER TABLE reviews_slug_backup_20251103 ENABLE ROW LEVEL SECURITY;

-- 3. Policy für Backup-Tabelle: Nur Admins können zugreifen
CREATE POLICY "Only admins can access backup"
ON reviews_slug_backup_20251103
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));