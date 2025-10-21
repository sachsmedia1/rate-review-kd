-- Update product_category constraint to include all 6 categories

-- Drop old constraint
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_product_category_check;

-- Add new constraint with all 6 categories
ALTER TABLE reviews
  ADD CONSTRAINT reviews_product_category_check
  CHECK (product_category IN (
    'Kaminofen',
    'Neubau Kaminanlage',
    'Austausch Kamineinsatz',
    'Kaminkassette',
    'Kaminkassette FreeStanding',
    'Austausch Kachelofeneinsatz'
  ));