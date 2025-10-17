-- Add image_type column to review_images table
ALTER TABLE review_images
ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'normal' CHECK (image_type IN ('before', 'after', 'normal'));

-- Create index for better performance (with safety check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_review_images_type'
  ) THEN
    CREATE INDEX idx_review_images_type ON review_images(review_id, image_type);
  END IF;
END$$;

-- Add documentation comment
COMMENT ON COLUMN review_images.image_type IS 'Bildtyp: before (Vorher), after (Nachher), normal (Standard-Projektbild)';