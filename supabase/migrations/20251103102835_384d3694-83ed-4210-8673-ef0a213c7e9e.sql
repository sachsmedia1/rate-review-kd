-- Fix security issues from slug migration

-- 1. Enable RLS on backup table
ALTER TABLE reviews_slug_backup_20251103 ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for backup table (only admins can access)
CREATE POLICY "Only admins can view backup table"
  ON reviews_slug_backup_20251103
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 3. Fix clean_slug_text function to have proper search_path
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
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;