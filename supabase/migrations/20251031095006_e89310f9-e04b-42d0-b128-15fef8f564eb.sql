-- ================================================
-- LOCATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  
  -- Status Flags
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  has_showroom BOOLEAN DEFAULT true,
  
  -- Kontaktdaten
  street_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  fax TEXT,
  email TEXT NOT NULL,
  
  -- SEO & Content
  description TEXT,
  service_areas TEXT,
  opening_hours TEXT,
  
  -- Google Integration
  google_maps_embed_url TEXT,
  google_business_url TEXT,
  
  -- Media
  logo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public kann alle aktiven Locations lesen
CREATE POLICY "Public read active locations"
  ON locations FOR SELECT
  USING (is_active = true);

-- Authenticated Users haben vollen Zugriff
CREATE POLICY "Authenticated full access"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_default ON locations(is_default);

-- ================================================
-- 4 STANDORTE EINFÜGEN
-- ================================================

INSERT INTO locations (
  name, 
  is_default, 
  has_showroom,
  street_address, 
  postal_code, 
  city, 
  phone, 
  fax,
  email,
  description,
  service_areas
) VALUES
  -- 1. BAMBERG (Default/Hauptsitz)
  (
    'Bamberg',
    true,
    true,
    'Böttgerstraße 8',
    '96050',
    'Bamberg',
    '+49 951 18073890',
    NULL,
    'info@der-kamindoktor.de',
    'Der Kamindoktor Bamberg - Hauptsitz und Ausstellungsraum. Ihr Experte für Kaminöfen, Kaminanlagen und Kaminkassetten seit 2010.',
    'Bamberg, Forchheim, Bayreuth, Coburg, Lichtenfels, Kronach'
  ),
  
  -- 2. RÖDERMARK
  (
    'Rödermark',
    false,
    true,
    'Odenwaldstraße 68',
    '63322',
    'Rödermark',
    '+49 6074 40741 86',
    NULL,
    'info@der-kamindoktor.de',
    'Der Kamindoktor Rödermark - Ausstellungsraum und Beratung für den Rhein-Main-Bereich.',
    'Rödermark, Frankfurt, Offenbach, Darmstadt, Aschaffenburg'
  ),
  
  -- 3. ESSEN (nur Montage)
  (
    'Essen',
    false,
    false,
    'Heinz-Bäcker-Str. 1',
    '45356',
    'Essen',
    NULL,
    NULL,
    'essen@der-kamindoktor.de',
    'Der Kamindoktor Essen - Montagestandort für das Ruhrgebiet. Keine Ausstellung vor Ort.',
    'Essen, Bochum, Dortmund, Duisburg, Gelsenkirchen, Mülheim'
  ),
  
  -- 4. HAMBURG
  (
    'Hamburg',
    false,
    true,
    'Bei den Kämpen 18A',
    '21220',
    'Seevetal',
    '+49 40 882 15 33 50',
    '+49 40 882 15 33 51',
    'hamburg@der-kamindoktor.de',
    'Der Kamindoktor Hamburg - Ausstellungsraum und Service für den Norden.',
    'Hamburg, Lübeck, Kiel, Neumünster, Stade, Lüneburg'
  );

-- ================================================
-- UPDATE TRIGGER für updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_locations_timestamp
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();