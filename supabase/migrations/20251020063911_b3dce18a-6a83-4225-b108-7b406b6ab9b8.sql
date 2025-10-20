-- ============================================
-- KAMINDOKTOR BEWERTUNGSSYSTEM UPDATE
-- Datum: 2025-10-20
-- Zweck: Neue Felder + Korrektur average_rating
-- ============================================

-- 1. NEUE FELDER HINZUFÜGEN
-- ------------------------------------------
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS street VARCHAR(200),
ADD COLUMN IF NOT EXISTS house_number VARCHAR(20);

COMMENT ON COLUMN reviews.customer_id IS 'Interne Kunden-ID (nur Nummern), für Landkarten-Zuordnung';
COMMENT ON COLUMN reviews.street IS 'Straßenname für Landkarte (optional)';
COMMENT ON COLUMN reviews.house_number IS 'Hausnummer für Landkarte (optional)';


-- 2. CONSTRAINT FÜR KUNDEN-ID (nur Zahlen)
-- ------------------------------------------
-- Erst prüfen ob Constraint bereits existiert, dann hinzufügen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customer_id_numeric'
    ) THEN
        ALTER TABLE reviews
        ADD CONSTRAINT customer_id_numeric 
        CHECK (customer_id IS NULL OR customer_id ~ '^\d+$');
    END IF;
END $$;


-- 3. INDEX FÜR PERFORMANCE (Landkarten-Suche)
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id 
ON reviews(customer_id) 
WHERE customer_id IS NOT NULL;


-- 4. AVERAGE_RATING KORRIGIEREN
-- ------------------------------------------
-- Schritt A: Alte GENERATED COLUMN entfernen
ALTER TABLE reviews DROP COLUMN IF EXISTS average_rating;

-- Schritt B: Neu erstellen mit korrekter Logik
ALTER TABLE reviews
ADD COLUMN average_rating DECIMAL(3,2) GENERATED ALWAYS AS (
  CASE 
    -- Fall 1: Beide optional Ratings sind NULL → 4 Ratings zählen
    WHEN rating_fire_safety IS NULL AND rating_heating_performance IS NULL THEN
      ROUND(
        (COALESCE(rating_consultation, 0) + 
         COALESCE(rating_aesthetics, 0) + 
         COALESCE(rating_installation_quality, 0) + 
         COALESCE(rating_service, 0)) / 4.0,
        2
      )
    
    -- Fall 2: Nur fire_safety ist NULL → 5 Ratings zählen
    WHEN rating_fire_safety IS NULL THEN
      ROUND(
        (COALESCE(rating_consultation, 0) + 
         COALESCE(rating_heating_performance, 0) + 
         COALESCE(rating_aesthetics, 0) + 
         COALESCE(rating_installation_quality, 0) + 
         COALESCE(rating_service, 0)) / 5.0,
        2
      )
    
    -- Fall 3: Nur heating_performance ist NULL → 5 Ratings zählen
    WHEN rating_heating_performance IS NULL THEN
      ROUND(
        (COALESCE(rating_consultation, 0) + 
         COALESCE(rating_fire_safety, 0) + 
         COALESCE(rating_aesthetics, 0) + 
         COALESCE(rating_installation_quality, 0) + 
         COALESCE(rating_service, 0)) / 5.0,
        2
      )
    
    -- Fall 4: Alle 6 Ratings gesetzt → 6 Ratings zählen
    ELSE
      ROUND(
        (COALESCE(rating_consultation, 0) + 
         COALESCE(rating_fire_safety, 0) + 
         COALESCE(rating_heating_performance, 0) + 
         COALESCE(rating_aesthetics, 0) + 
         COALESCE(rating_installation_quality, 0) + 
         COALESCE(rating_service, 0)) / 6.0,
        2
      )
  END
) STORED;

COMMENT ON COLUMN reviews.average_rating IS 'Automatisch berechneter Durchschnitt (dynamisch je nach gesetzten Ratings)';