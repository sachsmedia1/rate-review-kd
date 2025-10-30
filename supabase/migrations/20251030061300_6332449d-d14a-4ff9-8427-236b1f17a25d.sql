-- Add SELECT policy for authenticated users to see ALL reviews (not just published)
-- This allows admin users to see draft, pending, and published reviews

CREATE POLICY "reviews_authenticated_select"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Note: The existing reviews_public_select policy will still allow
-- public (non-authenticated) users to see only published reviews