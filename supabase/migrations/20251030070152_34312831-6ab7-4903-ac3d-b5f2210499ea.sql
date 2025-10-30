-- ============================================================================
-- SEO Settings Table Migration - Der Kamindoktor Review System
-- ============================================================================
-- Version: 1.0
-- Description: Creates seo_settings table for category descriptions, 
--              company info, and SEO content management
-- ============================================================================

-- 1. Create seo_settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- =========================================================================
  -- KATEGORIE-SEO-CONTENT
  -- =========================================================================
  -- Struktur: JSONB mit allen Kategorien
  -- {
  --   "Kaminofen": {
  --     "meta_title_template": "...",
  --     "meta_description_template": "...",
  --     "heading": "...",
  --     "description": "...",
  --     "faq": [...]
  --   },
  --   ...
  -- }
  category_seo_content JSONB DEFAULT '{}'::jsonb NOT NULL,
  
  -- =========================================================================
  -- UNTERNEHMENSINFORMATIONEN (Schema.org LocalBusiness)
  -- =========================================================================
  company_name VARCHAR(255) DEFAULT 'Der Kamindoktor' NOT NULL,
  company_legal_name VARCHAR(255) DEFAULT 'Der Kamindoktor GmbH & Co. KG',
  company_description TEXT DEFAULT 'Ihr Experte für Kaminbau, Ofenbau und Schornsteinbau in Oberfranken',
  company_founded_year INTEGER DEFAULT 2010,
  company_logo_url TEXT DEFAULT '/logo.png',
  company_email VARCHAR(255) DEFAULT 'info@der-kamindoktor.de',
  company_phone VARCHAR(50) DEFAULT '+49 951 123456',
  company_website VARCHAR(255) DEFAULT 'https://der-kamindoktor.de',
  
  -- Adresse (Schema.org PostalAddress)
  address_street VARCHAR(255) DEFAULT 'Hauptstraße 123',
  address_city VARCHAR(255) DEFAULT 'Litzendorf',
  address_postal_code VARCHAR(10) DEFAULT '96123',
  address_region VARCHAR(100) DEFAULT 'Bayern',
  address_country VARCHAR(2) DEFAULT 'DE',
  
  -- Social Media (Schema.org sameAs)
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  social_xing TEXT,
  
  -- Service-Gebiete (für Schema.org areaServed)
  service_areas JSONB DEFAULT '["Bamberg", "Litzendorf", "Forchheim", "Erlangen", "Bayreuth", "Coburg"]'::jsonb,
  
  -- Regionale Keywords (für SEO-Optimierung)
  regional_keywords JSONB DEFAULT '["Oberfranken", "Franken", "Bayern", "Bamberg Umgebung"]'::jsonb,
  
  -- =========================================================================
  -- GLOBALE SEO-EINSTELLUNGEN
  -- =========================================================================
  default_meta_description TEXT DEFAULT 'Authentische Kundenbewertungen für Kaminbau, Ofenbau und Schornsteinbau. Über 5.000 zufriedene Kunden in ganz Deutschland.',
  default_og_image_url TEXT DEFAULT '/og-image.jpg',
  
  -- Canonical Base URL
  canonical_base_url VARCHAR(255) DEFAULT 'https://bewertungen.der-kamindoktor.de',
  
  -- Google Analytics / Tracking
  google_analytics_id VARCHAR(50),
  google_tag_manager_id VARCHAR(50),
  
  -- =========================================================================
  -- TIMESTAMPS
  -- =========================================================================
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. Insert default settings (Singleton Pattern - nur 1 Zeile)
-- ============================================================================
INSERT INTO seo_settings (
  id,
  company_name,
  company_legal_name,
  company_description,
  company_founded_year,
  company_email,
  company_phone,
  company_website,
  address_street,
  address_city,
  address_postal_code,
  address_region,
  category_seo_content
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Der Kamindoktor',
  'Der Kamindoktor GmbH & Co. KG',
  'Der Kamindoktor ist Ihr Experte für professionellen Kaminbau, Ofenbau und Schornsteinbau in Oberfranken. Mit über 12 Jahren Erfahrung und mehr als 5.000 zufriedenen Kunden bieten wir höchste Qualität von der Beratung bis zur Installation.',
  2010,
  'info@der-kamindoktor.de',
  '+49 951 123456',
  'https://der-kamindoktor.de',
  'Hauptstraße 123',
  'Litzendorf',
  '96123',
  'Bayern',
  '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Create Updated Timestamp Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_seo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_settings_updated_at_trigger
BEFORE UPDATE ON seo_settings
FOR EACH ROW
EXECUTE FUNCTION update_seo_settings_updated_at();

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- Public: Kann Settings lesen (für Frontend)
CREATE POLICY "Public users can view seo_settings"
ON seo_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated: Kann Settings aktualisieren (für Admin)
CREATE POLICY "Authenticated users can update seo_settings"
ON seo_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. Create Indexes
-- ============================================================================
-- JSONB GIN Index für schnelle Suche in category_seo_content
CREATE INDEX idx_category_seo_content_gin 
ON seo_settings USING GIN (category_seo_content);

CREATE INDEX idx_service_areas_gin 
ON seo_settings USING GIN (service_areas);