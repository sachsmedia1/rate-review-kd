-- Allow service role full access to reviews table for backend operations
CREATE POLICY "Allow service role full access"
ON reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);