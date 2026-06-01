-- ═══════════════════════════════════════════════════════════════
--  JARVIS — GYM STRENGTH SCHEMA EXTENSIONS
--  Run this ONCE in your Supabase SQL Editor.
--  Adds relative_strength_ratios table + fixes session_sets/stall_tracking
--  for the new soccer-specific gym program.
-- ═══════════════════════════════════════════════════════════════

-- ============================================
--  1. Add exercise_name column to session_sets
--     (so exercises can be referenced by name directly)
-- ============================================
ALTER TABLE public.session_sets ADD COLUMN IF NOT EXISTS exercise_name TEXT;

CREATE INDEX IF NOT EXISTS idx_session_sets_exercise_name ON public.session_sets(exercise_name);

-- ============================================
--  2. Add exercise_name column to stall_tracking
--     (so stalls can be tracked by exercise name)
-- ============================================
ALTER TABLE public.stall_tracking ADD COLUMN IF NOT EXISTS exercise_name TEXT;

CREATE INDEX IF NOT EXISTS idx_stall_tracking_exercise_name ON public.stall_tracking(exercise_name);

-- ============================================
--  3. RELATIVE STRENGTH RATIOS
--     Tracks estimated 1RM / bodyweight for key lifts
-- ============================================
CREATE TABLE IF NOT EXISTS public.relative_strength_ratios (
  id               BIGSERIAL PRIMARY KEY,
  date             TEXT NOT NULL,
  exercise_name    TEXT NOT NULL,
  estimated_1rm    NUMERIC,
  bodyweight_lbs   NUMERIC,
  ratio            NUMERIC,
  target_ratio     NUMERIC,
  elite_ratio      NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.relative_strength_ratios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_relative_strength_ratios" ON public.relative_strength_ratios FOR SELECT USING (true);
CREATE POLICY "anon_insert_relative_strength_ratios" ON public.relative_strength_ratios FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_relative_strength_ratios" ON public.relative_strength_ratios FOR UPDATE USING (true);
CREATE POLICY "anon_delete_relative_strength_ratios" ON public.relative_strength_ratios FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_relative_strength_ratios_date ON public.relative_strength_ratios(date);
CREATE INDEX IF NOT EXISTS idx_relative_strength_ratios_exercise ON public.relative_strength_ratios(exercise_name);

-- ============================================
--  VERIFY
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'session_sets'
--   ORDER BY ordinal_position;
