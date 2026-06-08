-- ═══════════════════════════════════════════════════════════════
--  JARVIS — ALL SCHEMAS (combined)
--  Run this ONCE in your Supabase SQL Editor.
--  ⚠️  Run clean-slate-schema.sql FIRST before this file.
--  Safe to re-run — everything uses IF NOT EXISTS.
--  Covers: Calendar, Soccer, Football, Gym, Body, Storage
-- ═══════════════════════════════════════════════════════════════

-- ============================================
--  1. CALENDAR EVENTS
--     Source: calendar-schema.sql
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'gym',
  title TEXT NOT NULL DEFAULT '',
  notes TEXT,
  duration_minutes INTEGER,
  opponent TEXT,
  location TEXT,
  home_or_away TEXT DEFAULT 'home',
  work_hours NUMERIC(3,1),
  equipment_available TEXT DEFAULT 'full',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_calendar_events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "anon_select_calendar_events" ON public.calendar_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_calendar_events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "anon_insert_calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_calendar_events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "anon_update_calendar_events" ON public.calendar_events FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_calendar_events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "anon_delete_calendar_events" ON public.calendar_events FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(event_type);

ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;


-- ============================================
--  2. SOCCER TABLES
--     Source: soccer-supabase-schema.sql
-- ============================================

-- 2a. Athletic Tests
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_athletic_tests' AND tablename = 'athletic_tests') THEN
    CREATE POLICY "anon_select_athletic_tests" ON public.athletic_tests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_athletic_tests' AND tablename = 'athletic_tests') THEN
    CREATE POLICY "anon_insert_athletic_tests" ON public.athletic_tests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_athletic_tests' AND tablename = 'athletic_tests') THEN
    CREATE POLICY "anon_update_athletic_tests" ON public.athletic_tests FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_athletic_tests' AND tablename = 'athletic_tests') THEN
    CREATE POLICY "anon_delete_athletic_tests" ON public.athletic_tests FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_athletic_tests_date ON public.athletic_tests(date);
CREATE INDEX IF NOT EXISTS idx_athletic_tests_type ON public.athletic_tests(test_type);


-- 2b. Sprint Decay Sessions
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_sprint_decay_sessions' AND tablename = 'sprint_decay_sessions') THEN
    CREATE POLICY "anon_select_sprint_decay_sessions" ON public.sprint_decay_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_sprint_decay_sessions' AND tablename = 'sprint_decay_sessions') THEN
    CREATE POLICY "anon_insert_sprint_decay_sessions" ON public.sprint_decay_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_sprint_decay_sessions' AND tablename = 'sprint_decay_sessions') THEN
    CREATE POLICY "anon_update_sprint_decay_sessions" ON public.sprint_decay_sessions FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_sprint_decay_sessions' AND tablename = 'sprint_decay_sessions') THEN
    CREATE POLICY "anon_delete_sprint_decay_sessions" ON public.sprint_decay_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sprint_decay_sessions_date ON public.sprint_decay_sessions(date);


-- 2c. Soccer Sessions
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_soccer_sessions' AND tablename = 'soccer_sessions') THEN
    CREATE POLICY "anon_select_soccer_sessions" ON public.soccer_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_soccer_sessions' AND tablename = 'soccer_sessions') THEN
    CREATE POLICY "anon_insert_soccer_sessions" ON public.soccer_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_soccer_sessions' AND tablename = 'soccer_sessions') THEN
    CREATE POLICY "anon_update_soccer_sessions" ON public.soccer_sessions FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_soccer_sessions' AND tablename = 'soccer_sessions') THEN
    CREATE POLICY "anon_delete_soccer_sessions" ON public.soccer_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_soccer_sessions_date ON public.soccer_sessions(date);
CREATE INDEX IF NOT EXISTS idx_soccer_sessions_type ON public.soccer_sessions(session_type);


-- 2d. Offseason Plan
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_offseason_plan' AND tablename = 'offseason_plan') THEN
    CREATE POLICY "anon_select_offseason_plan" ON public.offseason_plan FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_offseason_plan' AND tablename = 'offseason_plan') THEN
    CREATE POLICY "anon_insert_offseason_plan" ON public.offseason_plan FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_offseason_plan' AND tablename = 'offseason_plan') THEN
    CREATE POLICY "anon_update_offseason_plan" ON public.offseason_plan FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_offseason_plan' AND tablename = 'offseason_plan') THEN
    CREATE POLICY "anon_delete_offseason_plan" ON public.offseason_plan FOR DELETE USING (true);
  END IF;
END $$;


-- ============================================
--  3. FOOTBALL / TECHNICAL TABLES
--     Source: football-schema.sql
-- ============================================

-- 3a. Technical Sessions
CREATE TABLE IF NOT EXISTS public.technical_sessions (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  session_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity TEXT DEFAULT 'medium',
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 10),
  focus_areas JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.technical_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_technical_sessions' AND tablename = 'technical_sessions') THEN
    CREATE POLICY "anon_select_technical_sessions" ON public.technical_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_technical_sessions' AND tablename = 'technical_sessions') THEN
    CREATE POLICY "anon_insert_technical_sessions" ON public.technical_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_technical_sessions' AND tablename = 'technical_sessions') THEN
    CREATE POLICY "anon_update_technical_sessions" ON public.technical_sessions FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_technical_sessions' AND tablename = 'technical_sessions') THEN
    CREATE POLICY "anon_delete_technical_sessions" ON public.technical_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_technical_sessions_date ON public.technical_sessions(date);

ALTER PUBLICATION supabase_realtime ADD TABLE public.technical_sessions;


-- 3b. Match Performances
CREATE TABLE IF NOT EXISTS public.match_performances (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  competition_type TEXT NOT NULL,
  minutes_played INTEGER,
  position TEXT,
  result TEXT,
  engine_rating INTEGER CHECK (engine_rating >= 1 AND engine_rating <= 10),
  defensive_rating INTEGER CHECK (defensive_rating >= 1 AND defensive_rating <= 10),
  progressive_rating INTEGER CHECK (progressive_rating >= 1 AND progressive_rating <= 10),
  aerial_rating INTEGER CHECK (aerial_rating >= 1 AND aerial_rating <= 10),
  press_resistance_rating INTEGER CHECK (press_resistance_rating >= 1 AND press_resistance_rating <= 10),
  decision_speed_rating INTEGER CHECK (decision_speed_rating >= 1 AND decision_speed_rating <= 10),
  notes TEXT,
  ai_coaching_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.match_performances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_match_performances' AND tablename = 'match_performances') THEN
    CREATE POLICY "anon_select_match_performances" ON public.match_performances FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_match_performances' AND tablename = 'match_performances') THEN
    CREATE POLICY "anon_insert_match_performances" ON public.match_performances FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_match_performances' AND tablename = 'match_performances') THEN
    CREATE POLICY "anon_update_match_performances" ON public.match_performances FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_match_performances' AND tablename = 'match_performances') THEN
    CREATE POLICY "anon_delete_match_performances" ON public.match_performances FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_performances_date ON public.match_performances(date);

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_performances;


-- ============================================
--  4. GYM FIXES
--     Source: migrate-gym-fixes.sql
--     (gym-strength-schema.sql is a subset of this)
-- ============================================

ALTER TABLE public.session_sets ADD COLUMN IF NOT EXISTS exercise_name TEXT;
ALTER TABLE public.session_sets ALTER COLUMN exercise_id DROP NOT NULL;

ALTER TABLE public.stall_tracking ADD COLUMN IF NOT EXISTS exercise_name TEXT;
ALTER TABLE public.stall_tracking ALTER COLUMN exercise_id DROP NOT NULL;

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_relative_strength_ratios' AND tablename = 'relative_strength_ratios') THEN
    ALTER TABLE public.relative_strength_ratios ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "anon_select_relative_strength_ratios" ON public.relative_strength_ratios FOR SELECT USING (true);
    CREATE POLICY "anon_insert_relative_strength_ratios" ON public.relative_strength_ratios FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_relative_strength_ratios" ON public.relative_strength_ratios FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_relative_strength_ratios" ON public.relative_strength_ratios FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_relative_strength_date ON public.relative_strength_ratios(date);
CREATE INDEX IF NOT EXISTS idx_relative_strength_ratios_exercise ON public.relative_strength_ratios(exercise_name);
CREATE INDEX IF NOT EXISTS idx_session_sets_exercise_name ON public.session_sets(exercise_name);
CREATE INDEX IF NOT EXISTS idx_stall_tracking_exercise_name ON public.stall_tracking(exercise_name);


-- ============================================
--  5. BODY TAB — note column on weight_logs
--     Source: body-schema.sql
-- ============================================

ALTER TABLE public.weight_logs ADD COLUMN IF NOT EXISTS note TEXT;


-- ============================================
--  6. STORAGE — progress-photos bucket
--     Source: storage-setup.sql
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_progress_photos' AND schemaname = 'storage') THEN
    CREATE POLICY "anon_select_progress_photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'progress-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_progress_photos' AND schemaname = 'storage') THEN
    CREATE POLICY "anon_insert_progress_photos"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'progress-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_progress_photos' AND schemaname = 'storage') THEN
    CREATE POLICY "anon_delete_progress_photos"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'progress-photos');
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════
--  VERIFY — run this after to confirm all tables exist:
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
-- Expected tables after running:
--   app_state, athletic_tests, calendar_events, daily_checkins,
--   exercises, match_performances, mesocycles, nutrition_profile,
--   offseason_plan, progress_photos, recovery_scores,
--   relative_strength_ratios, session_sets, soccer_sessions,
--   sprint_decay_sessions, stall_tracking, tdee_estimates,
--   technical_sessions, weight_logs, workout_sessions
