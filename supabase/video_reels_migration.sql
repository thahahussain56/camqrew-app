-- ==============================================================================
-- MIGRATION: ADD VIDEO REELS AND SHOWREELS TO PROFESSIONAL PROFILES
-- ==============================================================================

-- 1. Add video_reels column if not already present
ALTER TABLE public.professional_profiles 
  ADD COLUMN IF NOT EXISTS video_reels JSONB DEFAULT '[]'::jsonb;

-- 2. Add comment describing schema
COMMENT ON COLUMN public.professional_profiles.video_reels IS 
  'Structured list of video reels and showreels [{ id, title, url, type, embedUrl, thumbnailUrl, category, isShort }]';

-- 3. Create index for fast JSON queries if needed
CREATE INDEX IF NOT EXISTS idx_pro_video_reels ON public.professional_profiles USING gin (video_reels);
