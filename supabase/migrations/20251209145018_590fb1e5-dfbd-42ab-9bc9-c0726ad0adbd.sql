-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create admin_profiles table for Google Drive folder sources
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  google_folder_id TEXT NOT NULL,
  google_folder_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create galleries table
CREATE TABLE public.galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_profile_id UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  selections_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  google_file_id TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  is_liked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign admin role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for admin_profiles
CREATE POLICY "Admins can view their own profiles"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create their own profiles"
  ON public.admin_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update their own profiles"
  ON public.admin_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete their own profiles"
  ON public.admin_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for galleries
CREATE POLICY "Admins can manage their own galleries"
  ON public.galleries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view galleries by share_token"
  ON public.galleries FOR SELECT
  USING (true);

-- RLS Policies for photos
CREATE POLICY "Admins can manage photos in their galleries"
  ON public.photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = photos.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view photos in any gallery"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "Public can update photo likes"
  ON public.photos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_galleries_share_token ON public.galleries(share_token);
CREATE INDEX idx_galleries_user_id ON public.galleries(user_id);
CREATE INDEX idx_photos_gallery_id ON public.photos(gallery_id);
CREATE INDEX idx_photos_is_liked ON public.photos(is_liked);
CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles(user_id);