-- Add company_name column to locations table
ALTER TABLE locations ADD COLUMN company_name TEXT;

-- Update existing locations with company names
UPDATE locations SET company_name = CASE 
  WHEN name = 'Bamberg' THEN 'Der Kamindoktor GmbH - Bamberg'
  WHEN name = 'Rödermark' THEN 'Der Kamindoktor GmbH - Rödermark'
  WHEN name = 'Essen' THEN 'Der Kamindoktor GmbH - Essen'
  WHEN name = 'Hamburg' THEN 'Der Kamindoktor GmbH - Hamburg'
  ELSE 'Der Kamindoktor GmbH - ' || name
END;