-- =====================================================
-- MIGRATION: Field Staff Management & Location Enhancement
-- =====================================================

-- AUFGABE 1: LOCATIONS TABELLE ERWEITERN
-- =====================================================

ALTER TABLE locations ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS showroom_info_url TEXT;

-- Geo-Koordinaten und URLs für bestehende Standorte
UPDATE locations SET 
  latitude = 49.8914, 
  longitude = 10.8889,
  showroom_info_url = 'https://der-kamindoktor.de/standorte/bamberg'
WHERE name = 'Bamberg';

UPDATE locations SET 
  latitude = 50.0330, 
  longitude = 8.8170,
  showroom_info_url = 'https://der-kamindoktor.de/standorte/roedermark'
WHERE name = 'Rödermark';

UPDATE locations SET 
  latitude = 51.4556, 
  longitude = 7.0116,
  showroom_info_url = 'https://der-kamindoktor.de/standorte/essen'
WHERE name = 'Essen';

UPDATE locations SET 
  latitude = 53.3957, 
  longitude = 9.9686,
  showroom_info_url = 'https://der-kamindoktor.de/standorte/hamburg'
WHERE name = 'Hamburg';

-- AUFGABE 2: FIELD_STAFF TABELLE ERSTELLEN
-- =====================================================

CREATE TABLE IF NOT EXISTS field_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Persönliche Daten
  area_name TEXT NOT NULL,
  area_number INTEGER CHECK (area_number >= 1 AND area_number <= 9),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  image_url TEXT,
  
  -- PLZ-Bereiche (PostgreSQL Text Array)
  assigned_postal_codes TEXT[] NOT NULL,
  
  -- Kontaktmöglichkeiten
  contact_form_url TEXT,
  
  -- Status & Sortierung
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: Mindestens 1 PLZ-Bereich
ALTER TABLE field_staff ADD CONSTRAINT check_postal_codes_not_empty 
  CHECK (array_length(assigned_postal_codes, 1) > 0);

-- AUFGABE 3: RLS POLICIES FÜR FIELD_STAFF
-- =====================================================

ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public kann nur aktive Mitarbeiter lesen
CREATE POLICY "Public read active field staff"
  ON field_staff FOR SELECT
  USING (is_active = true);

-- Policy 2: Admins haben vollen Zugriff
CREATE POLICY "Admin full access to field staff"
  ON field_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- AUFGABE 4: INDEXES FÜR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_field_staff_active 
  ON field_staff(is_active);

CREATE INDEX IF NOT EXISTS idx_field_staff_postal_codes 
  ON field_staff USING GIN(assigned_postal_codes);

CREATE INDEX IF NOT EXISTS idx_field_staff_display_order 
  ON field_staff(display_order);

CREATE INDEX IF NOT EXISTS idx_field_staff_area_number 
  ON field_staff(area_number);

CREATE INDEX IF NOT EXISTS idx_locations_coordinates 
  ON locations(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- AUFGABE 5: UPDATE TRIGGER FÜR FIELD_STAFF
-- =====================================================

CREATE OR REPLACE FUNCTION update_field_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_field_staff_timestamp
  BEFORE UPDATE ON field_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_field_staff_updated_at();

-- AUFGABE 6: PLZ-MATCHING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION find_field_staff_by_postal_code(search_plz TEXT)
RETURNS SETOF field_staff AS $$
DECLARE
  plz_prefix TEXT;
BEGIN
  -- Extrahiere ersten 2 Ziffern der PLZ
  plz_prefix := SUBSTRING(search_plz FROM 1 FOR 2);
  
  RETURN QUERY
  SELECT * FROM field_staff
  WHERE is_active = true
  AND (
    -- Exact Match: PLZ-Präfix direkt im Array (z.B. "01", "96")
    plz_prefix = ANY(assigned_postal_codes)
    OR
    -- Range Match: PLZ-Bereich wie "06-09" (enthält "07", "08")
    EXISTS (
      SELECT 1 FROM unnest(assigned_postal_codes) AS plz_range
      WHERE plz_range LIKE '%-%'
      AND plz_prefix::INTEGER BETWEEN 
        SPLIT_PART(plz_range, '-', 1)::INTEGER AND 
        SPLIT_PART(plz_range, '-', 2)::INTEGER
    )
  )
  ORDER BY display_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant Execute für authenticated und anon users
GRANT EXECUTE ON FUNCTION find_field_staff_by_postal_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_field_staff_by_postal_code(TEXT) TO anon;

-- AUFGABE 7: DEMO-DATEN EINFÜGEN
-- =====================================================

INSERT INTO field_staff (
  area_name,
  area_number,
  first_name,
  last_name,
  phone,
  email,
  assigned_postal_codes,
  contact_form_url,
  is_active,
  display_order
) VALUES
  (
    'Bereich 1: Ost',
    1,
    'Torsten',
    'N.',
    '+49 170 1234567',
    'torsten.n@der-kamindoktor.de',
    ARRAY['01', '02', '03', '04', '06-09', '13', '14', '16', '17', '19', '39'],
    'mailto:torsten.n@der-kamindoktor.de',
    true,
    1
  ),
  (
    'Bereich 9: Nord-Bayern',
    9,
    'Andrej',
    'G.',
    '+49 170 9876543',
    'andrej.g@der-kamindoktor.de',
    ARRAY['91', '92', '93', '94', '95', '96', '97', '98'],
    'https://der-kamindoktor.de/kontakt',
    true,
    9
  );