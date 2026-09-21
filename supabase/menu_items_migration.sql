-- ==============================================================================
-- MIGRATION: ADD MENU ITEMS & DISHES TO PROFESSIONAL PROFILES
-- ==============================================================================

-- 1. Add menu_items column if not already present
ALTER TABLE public.professional_profiles 
  ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]'::jsonb;

-- 2. Add comment describing schema
COMMENT ON COLUMN public.professional_profiles.menu_items IS 
  'Structured list of catering dishes and prices [{ id, name, category, pricePerPlate, dietaryTags, description, imageUrl, isAvailable }]';

-- 3. Create index for fast JSON queries if needed
CREATE INDEX IF NOT EXISTS idx_pro_menu_items ON public.professional_profiles USING gin (menu_items);
