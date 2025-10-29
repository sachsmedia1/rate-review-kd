-- ================================
-- FIX #1: COMPLETE RLS POLICY SETUP
-- ================================

-- Ensure RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Service role full access" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_delete" ON public.reviews;
DROP POLICY IF EXISTS "reviews_service_role_all" ON public.reviews;

-- Grant necessary table permissions
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Create comprehensive RLS policies

-- Policy 1: Public can read published reviews
CREATE POLICY "reviews_public_select" 
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (status = 'published' OR is_published = true);

-- Policy 2: Authenticated users can INSERT
CREATE POLICY "reviews_authenticated_insert" 
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Authenticated users can UPDATE
CREATE POLICY "reviews_authenticated_update" 
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Authenticated users can DELETE
CREATE POLICY "reviews_authenticated_delete" 
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Policy 5: Service role has full access (for Edge Functions)
CREATE POLICY "reviews_service_role_all" 
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);