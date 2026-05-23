-- ═══════════════════════════════════════════════════════════════
--  JARVIS — SUPABASE STORAGE BUCKET SETUP
--  Run this SEPARATELY in Supabase SQL Editor (requires superuser)
--  Creates the progress-photos bucket for weight tab photo storage
-- ═══════════════════════════════════════════════════════════════

-- Create the storage bucket (public = true so photos are accessible via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anon users to view photos
CREATE POLICY "anon_select_progress_photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos');

-- Allow anon users to upload photos
CREATE POLICY "anon_insert_progress_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos');

-- Allow anon users to delete their photos
CREATE POLICY "anon_delete_progress_photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'progress-photos');

-- Verify bucket exists
-- SELECT * FROM storage.buckets WHERE name = 'progress-photos';
