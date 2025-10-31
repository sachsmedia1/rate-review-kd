-- Create storage bucket for location logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'location-logos',
  'location-logos',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for location-logos bucket
CREATE POLICY "Public can view location logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'location-logos');

CREATE POLICY "Authenticated can upload location logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-logos');

CREATE POLICY "Authenticated can update location logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'location-logos');

CREATE POLICY "Authenticated can delete location logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-logos');