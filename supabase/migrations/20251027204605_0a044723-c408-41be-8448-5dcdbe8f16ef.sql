-- Drop old constraint
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_status_check;

-- Add new constraint with 'pending'
ALTER TABLE reviews 
ADD CONSTRAINT reviews_status_check 
CHECK (status IN ('published', 'draft', 'pending'));