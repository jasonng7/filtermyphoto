CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: admin_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    google_folder_id text NOT NULL,
    google_folder_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: galleries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.galleries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    admin_profile_id uuid,
    title text NOT NULL,
    share_token text NOT NULL,
    selections_submitted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gallery_id uuid NOT NULL,
    filename text NOT NULL,
    google_file_id text NOT NULL,
    thumbnail_url text NOT NULL,
    is_liked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_profiles admin_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_profiles
    ADD CONSTRAINT admin_profiles_pkey PRIMARY KEY (id);


--
-- Name: galleries galleries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_pkey PRIMARY KEY (id);


--
-- Name: galleries galleries_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_share_token_key UNIQUE (share_token);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles USING btree (user_id);


--
-- Name: idx_galleries_share_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galleries_share_token ON public.galleries USING btree (share_token);


--
-- Name: idx_galleries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galleries_user_id ON public.galleries USING btree (user_id);


--
-- Name: idx_photos_gallery_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_gallery_id ON public.photos USING btree (gallery_id);


--
-- Name: idx_photos_is_liked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_is_liked ON public.photos USING btree (is_liked);


--
-- Name: admin_profiles admin_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_profiles
    ADD CONSTRAINT admin_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: galleries galleries_admin_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_admin_profile_id_fkey FOREIGN KEY (admin_profile_id) REFERENCES public.admin_profiles(id) ON DELETE SET NULL;


--
-- Name: galleries galleries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: photos photos_gallery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_gallery_id_fkey FOREIGN KEY (gallery_id) REFERENCES public.galleries(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_profiles Admins can create their own profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create their own profiles" ON public.admin_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: admin_profiles Admins can delete their own profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete their own profiles" ON public.admin_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: photos Admins can manage photos in their galleries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage photos in their galleries" ON public.photos USING ((EXISTS ( SELECT 1
   FROM public.galleries
  WHERE ((galleries.id = photos.gallery_id) AND (galleries.user_id = auth.uid())))));


--
-- Name: galleries Admins can manage their own galleries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage their own galleries" ON public.galleries USING ((auth.uid() = user_id));


--
-- Name: admin_profiles Admins can update their own profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their own profiles" ON public.admin_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: admin_profiles Admins can view their own profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view their own profiles" ON public.admin_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: photos Public can update photo likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can update photo likes" ON public.photos FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: galleries Public can view galleries by share_token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view galleries by share_token" ON public.galleries FOR SELECT USING (true);


--
-- Name: photos Public can view photos in any gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view photos in any gallery" ON public.photos FOR SELECT USING (true);


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: galleries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

--
-- Name: photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


