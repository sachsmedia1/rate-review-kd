-- Allow customer_firstname to be NULL
ALTER TABLE reviews 
  ALTER COLUMN customer_firstname DROP NOT NULL;

-- Allow installation_date to be NULL
ALTER TABLE reviews 
  ALTER COLUMN installation_date DROP NOT NULL;