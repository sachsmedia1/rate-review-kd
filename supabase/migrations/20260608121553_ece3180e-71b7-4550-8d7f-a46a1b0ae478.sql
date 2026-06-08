ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS pinterest_pin_id TEXT,
  ADD COLUMN IF NOT EXISTS pinterest_pin_url TEXT,
  ADD COLUMN IF NOT EXISTS pinterest_collage_url TEXT,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_pinned_at ON public.reviews(pinned_at) WHERE pinned_at IS NOT NULL;