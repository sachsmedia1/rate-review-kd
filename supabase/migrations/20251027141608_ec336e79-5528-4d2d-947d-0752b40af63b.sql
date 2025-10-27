-- Add UNIQUE constraint to legacy_id column
ALTER TABLE reviews 
ADD CONSTRAINT reviews_legacy_id_unique UNIQUE (legacy_id);