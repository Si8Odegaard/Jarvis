-- ═══════════════════════════════════════════════════════════════
--  JARVIS — BODY & PERFORMANCE SCHEMA EXTENSION
--  Run this ONCE in your Supabase SQL Editor.
--  Adds note column to weight_logs for body.html.
-- ═══════════════════════════════════════════════════════════════

-- Add note column to weight_logs
ALTER TABLE public.weight_logs ADD COLUMN IF NOT EXISTS note TEXT;

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'weight_logs'
--   ORDER BY ordinal_position;
