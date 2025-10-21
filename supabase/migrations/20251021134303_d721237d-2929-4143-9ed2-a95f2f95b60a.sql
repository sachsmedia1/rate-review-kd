-- Schritt 1: "Denis" → "Bamberg" umbenennen
UPDATE reviews 
SET installed_by = 'Bamberg' 
WHERE installed_by = 'Denis';

-- Schritt 2: Alle anderen ungültigen Werte auf NULL setzen
UPDATE reviews 
SET installed_by = NULL 
WHERE installed_by NOT IN ('Bamberg', 'Essen', 'Rödermark', 'Hamburg');

-- Schritt 3: Constraint hinzufügen (nur noch diese 4 Werte erlauben)
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_installed_by_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_installed_by_check 
  CHECK (installed_by IN ('Bamberg', 'Essen', 'Rödermark', 'Hamburg') OR installed_by IS NULL);