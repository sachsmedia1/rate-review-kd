-- Drop the existing check constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_salutation_check;

-- Add new check constraint with all allowed values
ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_salutation_check 
CHECK (customer_salutation IN ('Herr', 'Frau', 'Dr.', 'Familie'));