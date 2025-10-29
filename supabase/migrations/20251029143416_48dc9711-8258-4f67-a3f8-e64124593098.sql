-- Fix RLS issues on reviews table

-- 1. Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies to avoid duplicates
DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow service role full access" ON public.reviews;

-- 3. Create new comprehensive policies

-- Allow public to read published reviews (checking BOTH status and is_published for safety)
CREATE POLICY "Public can view published reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (status = 'published' OR is_published = true);

-- Allow authenticated users full CRUD
CREATE POLICY "Authenticated users can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Allow service role full access (for background operations)
CREATE POLICY "Service role full access"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);