-- Lösche die review_images Tabelle
-- Da Vorher-/Nachher-Bilder jetzt direkt in der reviews Tabelle gespeichert werden,
-- wird diese Tabelle nicht mehr benötigt

DROP TABLE IF EXISTS public.review_images CASCADE;