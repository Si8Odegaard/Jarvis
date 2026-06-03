-- ═══════════════════════════════════════════════════════════════
--  GYM TAB FIXES — Migration
--  Run this in your Supabase SQL Editor.
--  Adds columns/tables that are referenced in gym.html but missing
--  from the clean-slate schema.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add exercise_name to session_sets (used for filtering & inserts)
ALTER TABLE public.session_sets 
  ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- 2. Make exercise_id nullable (code doesn't always set it)
ALTER TABLE public.session_sets 
  ALTER COLUMN exercise_id DROP NOT NULL;

-- 3. Add exercise_name to stall_tracking (used for filtering)
ALTER TABLE public.stall_tracking 
  ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- 4. Make exercise_id nullable in stall_tracking
ALTER TABLE public.stall_tracking 
  ALTER COLUMN exercise_id DROP NOT NULL;

-- 5. Create relative_strength_ratios table (used in gym save flow)
CREATE TABLE IF NOT EXISTS public.relative_strength_ratios (
  id            BIGSERIAL PRIMARY KEY,
  date          TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  estimated_1rm NUMERIC,
  bodyweight_lbs NUMERIC,
  ratio         NUMERIC,
  target_ratio  NUMERIC,
  elite_ratio   NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.relative_strength_ratios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_relative_strength_ratios" ON public.relative_strength_ratios FOR SELECT USING (true);
CREATE POLICY "anon_insert_relative_strength_ratios" ON public.relative_strength_ratios FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_relative_strength_ratios" ON public.relative_strength_ratios FOR UPDATE USING (true);
CREATE POLICY "anon_delete_relative_strength_ratios" ON public.relative_strength_ratios FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_relative_strength_date ON public.relative_strength_ratios(date);

CREATE INDEX IF NOT EXISTS idx_session_sets_exercise_name ON public.session_sets(exercise_name);
