-- ═══════════════════════════════════════════════════════════════
--  JARVIS — MASTER SCHEMA (complete project)
--  This is the ONLY SQL file you need. Run this ONCE.
--  Safe to re-run — fully idempotent. No DROPs, no data loss.
--  Covers EVERY tab: Home, Calendar, Gym, Soccer, Football,
--  Nutrition, Health/Stack, Water, Body, Chat
-- ═══════════════════════════════════════════════════════════════

-- Helper: safely add a table to realtime publication
CREATE OR REPLACE FUNCTION safe_realtime_add(tbl_name TEXT)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = tbl_name
  ) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl_name);
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================
--  1. APP_STATE (shared by all tabs)
--     Key/value store for cross-tab sync
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_state (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_app_state' AND tablename = 'app_state') THEN
    CREATE POLICY "anon_select_app_state" ON public.app_state FOR SELECT USING (true);
    CREATE POLICY "anon_insert_app_state" ON public.app_state FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_app_state" ON public.app_state FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_app_state" ON public.app_state FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN PERFORM safe_realtime_add('app_state'); END $$;


-- ============================================
--  2. DAILY_CHECKINS (nutrition tab)
--     Morning check-in form data
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id            BIGSERIAL PRIMARY KEY,
  date          TEXT NOT NULL UNIQUE,
  sleep_hours   NUMERIC,
  sleep_quality INTEGER,
  energy_score  INTEGER,
  soreness      TEXT,
  protein_grams INTEGER,
  hydration     TEXT,
  calorie_hit   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_daily_checkins' AND tablename = 'daily_checkins') THEN
    CREATE POLICY "anon_select_daily_checkins" ON public.daily_checkins FOR SELECT USING (true);
    CREATE POLICY "anon_insert_daily_checkins" ON public.daily_checkins FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_daily_checkins" ON public.daily_checkins FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_daily_checkins" ON public.daily_checkins FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(date);


-- ============================================
--  3. RECOVERY_SCORES (nutrition tab)
--     Composite recovery score 0-100 per day
-- ============================================
CREATE TABLE IF NOT EXISTS public.recovery_scores (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  score      INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recovery_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_recovery_scores' AND tablename = 'recovery_scores') THEN
    CREATE POLICY "anon_select_recovery_scores" ON public.recovery_scores FOR SELECT USING (true);
    CREATE POLICY "anon_insert_recovery_scores" ON public.recovery_scores FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_recovery_scores" ON public.recovery_scores FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_recovery_scores" ON public.recovery_scores FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recovery_scores_date ON public.recovery_scores(date);


-- ============================================
--  4. NUTRITION_PROFILE (nutrition tab)
--     User's body stats & training phase
-- ============================================
CREATE TABLE IF NOT EXISTS public.nutrition_profile (
  id                 BIGSERIAL PRIMARY KEY,
  weight_lbs         NUMERIC,
  age                INTEGER,
  height_in          NUMERIC,
  training_frequency INTEGER DEFAULT 4,
  phase              TEXT DEFAULT 'maintenance',
  goal_weight_lbs    NUMERIC,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nutrition_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_nutrition_profile' AND tablename = 'nutrition_profile') THEN
    CREATE POLICY "anon_select_nutrition_profile" ON public.nutrition_profile FOR SELECT USING (true);
    CREATE POLICY "anon_insert_nutrition_profile" ON public.nutrition_profile FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_nutrition_profile" ON public.nutrition_profile FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_nutrition_profile" ON public.nutrition_profile FOR DELETE USING (true);
  END IF;
END $$;


-- ============================================
--  5. WEIGHT_LOGS (body / nutrition tabs)
--     Daily bodyweight entries
-- ============================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  weight     NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add note column if missing (body tab needs it)
ALTER TABLE public.weight_logs ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_weight_logs' AND tablename = 'weight_logs') THEN
    CREATE POLICY "anon_select_weight_logs" ON public.weight_logs FOR SELECT USING (true);
    CREATE POLICY "anon_insert_weight_logs" ON public.weight_logs FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_weight_logs" ON public.weight_logs FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_weight_logs" ON public.weight_logs FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs(date);


-- ============================================
--  6. EXERCISES (gym tab)
--     Exercise library
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  type           TEXT DEFAULT 'compound',
  day            TEXT,
  working_weight NUMERIC DEFAULT 0,
  sets           INTEGER DEFAULT 3,
  rep_min        INTEGER,
  rep_max        INTEGER,
  increment      NUMERIC DEFAULT 2.5,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_exercises' AND tablename = 'exercises') THEN
    CREATE POLICY "anon_select_exercises" ON public.exercises FOR SELECT USING (true);
    CREATE POLICY "anon_insert_exercises" ON public.exercises FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_exercises" ON public.exercises FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_exercises" ON public.exercises FOR DELETE USING (true);
  END IF;
END $$;


-- ============================================
--  7. WORKOUT_SESSIONS (gym tab)
--     One row per day the user trains
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  completed  BOOLEAN DEFAULT false,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_workout_sessions' AND tablename = 'workout_sessions') THEN
    CREATE POLICY "anon_select_workout_sessions" ON public.workout_sessions FOR SELECT USING (true);
    CREATE POLICY "anon_insert_workout_sessions" ON public.workout_sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_workout_sessions" ON public.workout_sessions FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_workout_sessions" ON public.workout_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(date);


-- ============================================
--  8. SESSION_SETS (gym tab)
--     Individual sets within a workout session
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_sets (
  id            BIGSERIAL PRIMARY KEY,
  session_id    BIGINT,
  exercise_id   BIGINT,
  exercise_name TEXT,
  set_number    INTEGER,
  reps          INTEGER,
  weight        NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_session_sets' AND tablename = 'session_sets') THEN
    CREATE POLICY "anon_select_session_sets" ON public.session_sets FOR SELECT USING (true);
    CREATE POLICY "anon_insert_session_sets" ON public.session_sets FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_session_sets" ON public.session_sets FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_session_sets" ON public.session_sets FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_session_sets_session  ON public.session_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON public.session_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_session_sets_exercise_name ON public.session_sets(exercise_name);


-- ============================================
--  9. MESOCYCLES (gym tab)
--     Training cycle config
-- ============================================
CREATE TABLE IF NOT EXISTS public.mesocycles (
  id           BIGSERIAL PRIMARY KEY,
  start_date   TEXT NOT NULL,
  length_weeks INTEGER DEFAULT 4,
  current_week INTEGER DEFAULT 1,
  phase        TEXT DEFAULT 'accumulation',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_mesocycles' AND tablename = 'mesocycles') THEN
    CREATE POLICY "anon_select_mesocycles" ON public.mesocycles FOR SELECT USING (true);
    CREATE POLICY "anon_insert_mesocycles" ON public.mesocycles FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_mesocycles" ON public.mesocycles FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_mesocycles" ON public.mesocycles FOR DELETE USING (true);
  END IF;
END $$;


-- ============================================
--  10. STALL_TRACKING (gym tab)
--      Tracks stalled progression per exercise
-- ============================================
CREATE TABLE IF NOT EXISTS public.stall_tracking (
  id               BIGSERIAL PRIMARY KEY,
  exercise_id      BIGINT,
  exercise_name    TEXT,
  sessions_stalled INTEGER DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stall_tracking ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_stall_tracking' AND tablename = 'stall_tracking') THEN
    CREATE POLICY "anon_select_stall_tracking" ON public.stall_tracking FOR SELECT USING (true);
    CREATE POLICY "anon_insert_stall_tracking" ON public.stall_tracking FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_stall_tracking" ON public.stall_tracking FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_stall_tracking" ON public.stall_tracking FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stall_tracking_exercise_name ON public.stall_tracking(exercise_name);


-- ============================================
--  11. TDEE_ESTIMATES (nutrition tab)
--      Daily TDEE calculations stored for trend tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.tdee_estimates (
  id                BIGSERIAL PRIMARY KEY,
  date              TEXT NOT NULL UNIQUE,
  bmr               NUMERIC,
  tdee              INTEGER,
  weight_lbs        NUMERIC,
  target_min        INTEGER,
  target_max        INTEGER,
  adjustment_reason TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tdee_estimates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_tdee_estimates' AND tablename = 'tdee_estimates') THEN
    CREATE POLICY "anon_select_tdee_estimates" ON public.tdee_estimates FOR SELECT USING (true);
    CREATE POLICY "anon_insert_tdee_estimates" ON public.tdee_estimates FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_tdee_estimates" ON public.tdee_estimates FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_tdee_estimates" ON public.tdee_estimates FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tdee_estimates_date ON public.tdee_estimates(date);


-- ============================================
--  12. RELATIVE_STRENGTH_RATIOS (gym / body tabs)
--      Bodyweight-to-strength ratio tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.relative_strength_ratios (
  id             BIGSERIAL PRIMARY KEY,
  date           TEXT NOT NULL,
  exercise_name  TEXT NOT NULL,
  estimated_1rm  NUMERIC,
  bodyweight_lbs NUMERIC,
  ratio          NUMERIC,
  target_ratio   NUMERIC,
  elite_ratio    NUMERIC,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.relative_strength_ratios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_relative_strength_ratios' AND tablename = 'relative_strength_ratios') THEN
    CREATE POLICY "anon_select_relative_strength_ratios" ON public.relative_strength_ratios FOR SELECT USING (true);
    CREATE POLICY "anon_insert_relative_strength_ratios" ON public.relative_strength_ratios FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_relative_strength_ratios" ON public.relative_strength_ratios FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_relative_strength_ratios" ON public.relative_strength_ratios FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_relative_strength_date ON public.relative_strength_ratios(date);
CREATE INDEX IF NOT EXISTS idx_relative_strength_ratios_exercise ON public.relative_strength_ratios(exercise_name);


-- ============================================
--  13. PROGRESS_PHOTOS (body tab)
--      Metadata for progress photos in Supabase Storage
-- ============================================
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id           BIGSERIAL PRIMARY KEY,
  date         TEXT NOT NULL,
  date_upper   TEXT,
  weight_lbs   NUMERIC,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_progress_photos' AND tablename = 'progress_photos') THEN
    CREATE POLICY "anon_select_progress_photos" ON public.progress_photos FOR SELECT USING (true);
    CREATE POLICY "anon_insert_progress_photos" ON public.progress_photos FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_progress_photos" ON public.progress_photos FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_progress_photos" ON public.progress_photos FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON public.progress_photos(date);


-- ============================================
--  14. CALENDAR_EVENTS (calendar tab)
--      Match & training calendar events
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
    CREATE POLICY "anon_insert_calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_calendar_events" ON public.calendar_events FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_calendar_events" ON public.calendar_events FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(event_type);

DO $$ BEGIN PERFORM safe_realtime_add('calendar_events'); END $$;


-- ============================================
--  15. ATHLETIC_TESTS (soccer / body tabs)
--      Monthly performance tests
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_athletic_tests' AND tablename = 'athletic_tests') THEN
    CREATE POLICY "anon_select_athletic_tests" ON public.athletic_tests FOR SELECT USING (true);
    CREATE POLICY "anon_insert_athletic_tests" ON public.athletic_tests FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_athletic_tests" ON public.athletic_tests FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_athletic_tests" ON public.athletic_tests FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_athletic_tests_date ON public.athletic_tests(date);
CREATE INDEX IF NOT EXISTS idx_athletic_tests_type ON public.athletic_tests(test_type);


-- ============================================
--  16. SPRINT_DECAY_SESSIONS (soccer / body tabs)
--      Repeated sprint test data
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_sprint_decay_sessions' AND tablename = 'sprint_decay_sessions') THEN
    CREATE POLICY "anon_select_sprint_decay_sessions" ON public.sprint_decay_sessions FOR SELECT USING (true);
    CREATE POLICY "anon_insert_sprint_decay_sessions" ON public.sprint_decay_sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_sprint_decay_sessions" ON public.sprint_decay_sessions FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_sprint_decay_sessions" ON public.sprint_decay_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sprint_decay_sessions_date ON public.sprint_decay_sessions(date);


-- ============================================
--  17. SOCCER_SESSIONS (soccer tab)
--      All training sessions
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_soccer_sessions' AND tablename = 'soccer_sessions') THEN
    CREATE POLICY "anon_select_soccer_sessions" ON public.soccer_sessions FOR SELECT USING (true);
    CREATE POLICY "anon_insert_soccer_sessions" ON public.soccer_sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_soccer_sessions" ON public.soccer_sessions FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_soccer_sessions" ON public.soccer_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_soccer_sessions_date ON public.soccer_sessions(date);
CREATE INDEX IF NOT EXISTS idx_soccer_sessions_type ON public.soccer_sessions(session_type);


-- ============================================
--  18. OFFSEASON_PLAN (soccer tab)
--      Plan configuration
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_offseason_plan' AND tablename = 'offseason_plan') THEN
    CREATE POLICY "anon_select_offseason_plan" ON public.offseason_plan FOR SELECT USING (true);
    CREATE POLICY "anon_insert_offseason_plan" ON public.offseason_plan FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_offseason_plan" ON public.offseason_plan FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_offseason_plan" ON public.offseason_plan FOR DELETE USING (true);
  END IF;
END $$;


-- ============================================
--  19. TECHNICAL_SESSIONS (soccer → technical tab)
--      Technical development sessions
-- ============================================
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
    CREATE POLICY "anon_insert_technical_sessions" ON public.technical_sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_technical_sessions" ON public.technical_sessions FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_technical_sessions" ON public.technical_sessions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_technical_sessions_date ON public.technical_sessions(date);

DO $$ BEGIN PERFORM safe_realtime_add('technical_sessions'); END $$;


-- ============================================
--  20. MATCH_PERFORMANCES (soccer → technical tab)
--      Match performance tracking
-- ============================================
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
    CREATE POLICY "anon_insert_match_performances" ON public.match_performances FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_match_performances" ON public.match_performances FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_match_performances" ON public.match_performances FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_performances_date ON public.match_performances(date);

DO $$ BEGIN PERFORM safe_realtime_add('match_performances'); END $$;


-- ============================================
--  21. STORAGE — progress-photos bucket
--      For body tab photo storage
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
--  VERIFY — run this after to confirm everything:
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;

-- Expected tables (20 total):
--   app_state, athletic_tests, calendar_events, daily_checkins,
--   exercises, match_performances, mesocycles, nutrition_profile,
--   offseason_plan, progress_photos, recovery_scores,
--   relative_strength_ratios, session_sets, soccer_sessions,
--   sprint_decay_sessions, stall_tracking, tdee_estimates,
--   technical_sessions, weight_logs, workout_sessions
