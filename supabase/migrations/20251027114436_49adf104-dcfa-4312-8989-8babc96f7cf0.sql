-- Add legacy_id column for MySQL import reference
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS legacy_id INTEGER;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_reviews_legacy_id ON reviews(legacy_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN reviews.legacy_id IS 'Reference ID from legacy MySQL database for data import tracking';