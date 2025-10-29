-- Add geocoding status tracking columns to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS geocoding_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Add index for better query performance on geocoding status
CREATE INDEX IF NOT EXISTS idx_reviews_geocoding_status ON reviews(geocoding_status);

-- Add comment for documentation
COMMENT ON COLUMN reviews.geocoding_status IS 'Status of geocoding: pending, success, failed';
COMMENT ON COLUMN reviews.geocoded_at IS 'Timestamp when the address was successfully geocoded';