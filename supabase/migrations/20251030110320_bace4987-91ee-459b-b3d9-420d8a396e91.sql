-- Create RPC Function for Business Stats
CREATE OR REPLACE FUNCTION public.get_business_stats()
RETURNS JSON AS $$
DECLARE
  total_reviews INTEGER;
  avg_rating NUMERIC;
BEGIN
  -- Count only published reviews
  SELECT COUNT(*) INTO total_reviews
  FROM public.reviews
  WHERE is_published = true;
  
  -- Average rating from published reviews
  SELECT ROUND(AVG(average_rating)::numeric, 2) INTO avg_rating
  FROM public.reviews
  WHERE is_published = true AND average_rating IS NOT NULL;
  
  -- Return as JSON
  RETURN json_build_object(
    'totalReviews', total_reviews,
    'averageRating', COALESCE(avg_rating, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant Execute Permission
GRANT EXECUTE ON FUNCTION public.get_business_stats() TO anon, authenticated;