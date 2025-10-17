-- RLS Policies für user_profiles: Admins können alle Profile verwalten

-- Policy: Admins dürfen alle user_profiles lesen
CREATE POLICY "Admins can read all user_profiles"
ON user_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins dürfen user_profiles updaten
CREATE POLICY "Admins can update user_profiles"
ON user_profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins dürfen user_profiles löschen
CREATE POLICY "Admins can delete user_profiles"
ON user_profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins dürfen user_profiles erstellen
CREATE POLICY "Admins can insert user_profiles"
ON user_profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));