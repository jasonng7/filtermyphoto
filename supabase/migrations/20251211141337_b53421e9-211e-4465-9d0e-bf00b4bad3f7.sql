-- Add display_order column to admin_profiles
ALTER TABLE public.admin_profiles 
ADD COLUMN display_order integer DEFAULT 0;

-- Add display_order column to galleries
ALTER TABLE public.galleries 
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing records with sequential order based on created_at
UPDATE public.admin_profiles 
SET display_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num 
  FROM public.admin_profiles
) as subquery 
WHERE public.admin_profiles.id = subquery.id;

UPDATE public.galleries 
SET display_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num 
  FROM public.galleries
) as subquery 
WHERE public.galleries.id = subquery.id;