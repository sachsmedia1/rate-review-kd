-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS Policies for review-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update review images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'review-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete review images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'review-images');

-- Allow public read access to review images
CREATE POLICY "Public can view review images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'review-images');