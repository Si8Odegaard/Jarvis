-- ═══════════════════════════════════════════════════════════════
--  JARVIS — SOCCER TRAINING SUPABASE SCHEMA
--  Run this ONCE in your Supabase SQL Editor.
--  Creates tables for the Soccer Training tab.
-- ═══════════════════════════════════════════════════════════════

-- ============================================
--  1. ATHLETIC_TESTS — monthly performance tests
-- ============================================
CREATE TABLE IF NOT EXISTS public.athletic_tests (
  id            BIGSERIAL PRIMARY KEY,
  date          TEXT NOT NULL,
  test_type     TEXT NOT NULL,
  value         NUMERIC,
  unit          TEXT,
  personal_best BOOLEAN DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.athletic_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_athletic_tests" ON public.athletic_tests FOR SELECT USING (true);
CREATE POLICY "anon_insert_athletic_tests" ON public.athletic_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_athletic_tests" ON public.athletic_tests FOR UPDATE USING (true);
CREATE POLICY "anon_delete_athletic_tests" ON public.athletic_tests FOR DELETE USING (true);

CREATE INDEX idx_athletic_tests_date ON public.athletic_tests(date);
CREATE INDEX idx_athletic_tests_type ON public.athletic_tests(test_type);


-- ============================================
--  2. SPRINT_DECAY_SESSIONS — repeated sprint test data
-- ============================================
CREATE TABLE IF NOT EXISTS public.sprint_decay_sessions (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL,
  split_1    NUMERIC,
  split_2    NUMERIC,
  split_3    NUMERIC,
  split_4    NUMERIC,
  split_5    NUMERIC,
  split_6    NUMERIC,
  best       NUMERIC,
  worst      NUMERIC,
  average    NUMERIC,
  decay_pct  NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sprint_decay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_sprint_decay_sessions" ON public.sprint_decay_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_sprint_decay_sessions" ON public.sprint_decay_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_sprint_decay_sessions" ON public.sprint_decay_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_sprint_decay_sessions" ON public.sprint_decay_sessions FOR DELETE USING (true);

CREATE INDEX idx_sprint_decay_sessions_date ON public.sprint_decay_sessions(date);


-- ============================================
--  3. SOCCER_SESSIONS — all training sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.soccer_sessions (
  id              BIGSERIAL PRIMARY KEY,
  date            TEXT NOT NULL,
  session_type    TEXT NOT NULL,
  sub_type        TEXT,
  duration_minutes INTEGER,
  intensity       TEXT,
  focus_areas     JSONB DEFAULT '[]',
  note            TEXT,
  self_rating     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.soccer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_soccer_sessions" ON public.soccer_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_soccer_sessions" ON public.soccer_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_soccer_sessions" ON public.soccer_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_soccer_sessions" ON public.soccer_sessions FOR DELETE USING (true);

CREATE INDEX idx_soccer_sessions_date ON public.soccer_sessions(date);
CREATE INDEX idx_soccer_sessions_type ON public.soccer_sessions(session_type);


-- ============================================
--  4. OFFSEASON_PLAN — plan configuration
-- ============================================
CREATE TABLE IF NOT EXISTS public.offseason_plan (
  id           BIGSERIAL PRIMARY KEY,
  start_date   TEXT NOT NULL,
  end_date     TEXT,
  current_phase TEXT DEFAULT 'foundation',
  phase_week   INTEGER DEFAULT 1,
  mode         TEXT DEFAULT 'offseason',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offseason_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_offseason_plan" ON public.offseason_plan FOR SELECT USING (true);
CREATE POLICY "anon_insert_offseason_plan" ON public.offseason_plan FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_offseason_plan" ON public.offseason_plan FOR UPDATE USING (true);
CREATE POLICY "anon_delete_offseason_plan" ON public.offseason_plan FOR DELETE USING (true);


-- ============================================
--  5. SPEED_SESSIONS — speed + agility sessions
-- ============================================
-- One row per Thursday/track session. drils_completed holds the checklist
-- (drill_name + group + completed). finisher_reps is an int[] of 400m
-- split times in seconds (length depends on phase: 2/3/4/5 reps). rpe is
-- session-level (not per-drill), 1–10. finisher_target_seconds is the
-- prescribed target for that phase so recent sessions can show avg vs
-- target without cross-tab reads.
CREATE TABLE IF NOT EXISTS public.speed_sessions (
  id                       BIGSERIAL PRIMARY KEY,
  date                     TEXT NOT NULL,
  phase                    TEXT NOT NULL,
  drills_completed         JSONB DEFAULT '[]',
  finisher_reps            INTEGER[],
  finisher_target_seconds  INTEGER,
  rpe                      INTEGER,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.speed_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_speed_sessions" ON public.speed_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_speed_sessions" ON public.speed_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_speed_sessions" ON public.speed_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_speed_sessions" ON public.speed_sessions FOR DELETE USING (true);

CREATE INDEX idx_speed_sessions_date ON public.speed_sessions(date);


-- ═══════════════════════════════════════════════════════════════
--  VERIFY
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
