-- Drop the existing CHECK constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_salutation_check;

-- Create new CHECK constraint with updated salutation values
ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_salutation_check 
CHECK (customer_salutation IN ('Herr', 'Frau', 'Herr Dr.', 'Frau Dr.', 'Familie'));