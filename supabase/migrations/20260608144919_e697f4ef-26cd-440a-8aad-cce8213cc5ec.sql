
-- Tighten write policies on reviews to admin-only
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_delete" ON public.reviews;

CREATE POLICY "reviews_admin_insert" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reviews_admin_update" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reviews_admin_delete" ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tighten seo_settings update to admin-only
DROP POLICY IF EXISTS "Authenticated users can update seo_settings" ON public.seo_settings;
CREATE POLICY "Admins can update seo_settings" ON public.seo_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict user_profiles broad visibility
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Tighten locations writes to admin-only (currently any authenticated user)
DROP POLICY IF EXISTS "Authenticated full access" ON public.locations;
CREATE POLICY "Admins can manage locations" ON public.locations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
