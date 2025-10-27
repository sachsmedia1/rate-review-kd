-- Allow postal_code to be NULL
ALTER TABLE reviews 
  ALTER COLUMN postal_code DROP NOT NULL;

-- Allow customer_lastname to be NULL
ALTER TABLE reviews 
  ALTER COLUMN customer_lastname DROP NOT NULL;