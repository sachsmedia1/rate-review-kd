-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  firstname TEXT,
  lastname TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create user_roles table (secure role management)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  is_published BOOLEAN GENERATED ALWAYS AS (status = 'published') STORED,
  
  -- Customer data
  customer_salutation TEXT CHECK (customer_salutation IN ('Herr', 'Frau')) NOT NULL,
  customer_firstname TEXT NOT NULL,
  customer_lastname TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  installation_date DATE NOT NULL,
  
  -- Geo data
  latitude FLOAT,
  longitude FLOAT,
  
  -- Product
  product_category TEXT CHECK (product_category IN ('Kaminofen', 'Neubau Kaminanlage', 'Austausch Kamineinsatz', 'Kaminkassette', 'Austausch Kachelofeneinsatz')) NOT NULL,
  
  -- Images
  before_image_url TEXT,
  after_image_url TEXT,
  
  -- Ratings (1-5)
  rating_consultation INTEGER CHECK (rating_consultation BETWEEN 1 AND 5),
  rating_fire_safety INTEGER CHECK (rating_fire_safety BETWEEN 1 AND 5),
  rating_heating_performance INTEGER CHECK (rating_heating_performance BETWEEN 1 AND 5),
  rating_aesthetics INTEGER CHECK (rating_aesthetics BETWEEN 1 AND 5),
  rating_installation_quality INTEGER CHECK (rating_installation_quality BETWEEN 1 AND 5),
  rating_service INTEGER CHECK (rating_service BETWEEN 1 AND 5),
  average_rating FLOAT GENERATED ALWAYS AS (
    (COALESCE(rating_consultation,0) + COALESCE(rating_fire_safety,0) + 
     COALESCE(rating_heating_performance,0) + COALESCE(rating_aesthetics,0) + 
     COALESCE(rating_installation_quality,0) + COALESCE(rating_service,0)) / 6.0
  ) STORED,
  
  -- Optional fields
  customer_comment TEXT,
  internal_notes TEXT,
  installed_by TEXT,
  meta_title TEXT,
  meta_description TEXT,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_category ON public.reviews(product_category);
CREATE INDEX idx_reviews_postal ON public.reviews(postal_code);
CREATE INDEX idx_reviews_published ON public.reviews(is_published) WHERE is_published = true;
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
-- Public can view published reviews
CREATE POLICY "Public can view published reviews"
ON public.reviews
FOR SELECT
TO anon
USING (is_published = true);

-- Authenticated users can view all reviews
CREATE POLICY "Authenticated users can view all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update reviews
CREATE POLICY "Authenticated users can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can delete reviews
CREATE POLICY "Authenticated users can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for user_profiles
-- Users can view all profiles
CREATE POLICY "Users can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles
-- Users can view all roles
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));