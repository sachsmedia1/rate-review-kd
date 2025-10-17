-- Create review_images table for multiple images per review
CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Public can view images of published reviews
CREATE POLICY "Public can view review images"
  ON public.review_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.is_published = true
    )
  );

-- Authenticated users can manage all review images
CREATE POLICY "Authenticated users can insert review images"
  ON public.review_images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update review images"
  ON public.review_images
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete review images"
  ON public.review_images
  FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX idx_review_images_review_id ON public.review_images(review_id);
CREATE INDEX idx_review_images_display_order ON public.review_images(display_order);