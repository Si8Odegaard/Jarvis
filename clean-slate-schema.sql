-- ═══════════════════════════════════════════════════════════════
--  JARVIS — CLEAN SLATE SUPABASE SCHEMA
--  Run this ONCE in your Supabase SQL Editor.
--  Wipes all old tables and creates one clean, correct schema.
--  Covers: Gym, Nutrition, Water, Health, Stack tabs
-- ═══════════════════════════════════════════════════════════════

-- ============================================
--  STEP 0: NUKE EVERYTHING (clean start)
--  Order matters — child tables before parents
-- ============================================
DROP TABLE IF EXISTS public.session_sets     CASCADE;
DROP TABLE IF EXISTS public.stall_tracking   CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.exercises        CASCADE;
DROP TABLE IF EXISTS public.mesocycles       CASCADE;
DROP TABLE IF EXISTS public.weight_logs      CASCADE;
DROP TABLE IF EXISTS public.recovery_scores  CASCADE;
DROP TABLE IF EXISTS public.daily_checkins   CASCADE;
DROP TABLE IF EXISTS public.nutrition_profile CASCADE;
DROP TABLE IF EXISTS public.progress_photos  CASCADE;
DROP TABLE IF EXISTS public.tdee_estimates   CASCADE;
DROP TABLE IF EXISTS public.app_state        CASCADE;


-- ============================================
--  1. APP_STATE  (shared by all tabs)
--  Key/value store for cross-tab sync
-- ============================================
CREATE TABLE public.app_state (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_app_state" ON public.app_state FOR SELECT USING (true);
CREATE POLICY "anon_insert_app_state" ON public.app_state FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_app_state" ON public.app_state FOR UPDATE USING (true);
CREATE POLICY "anon_delete_app_state" ON public.app_state FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;


-- ============================================
--  2. DAILY_CHECKINS  (nutrition tab)
--  Morning check-in form data
-- ============================================
CREATE TABLE public.daily_checkins (
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

CREATE POLICY "anon_select_daily_checkins" ON public.daily_checkins FOR SELECT USING (true);
CREATE POLICY "anon_insert_daily_checkins" ON public.daily_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_daily_checkins" ON public.daily_checkins FOR UPDATE USING (true);
CREATE POLICY "anon_delete_daily_checkins" ON public.daily_checkins FOR DELETE USING (true);

CREATE INDEX idx_daily_checkins_date ON public.daily_checkins(date);


-- ============================================
--  3. RECOVERY_SCORES  (nutrition tab)
--  Composite recovery score 0-100 per day
-- ============================================
CREATE TABLE public.recovery_scores (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  score      INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recovery_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_recovery_scores" ON public.recovery_scores FOR SELECT USING (true);
CREATE POLICY "anon_insert_recovery_scores" ON public.recovery_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_recovery_scores" ON public.recovery_scores FOR UPDATE USING (true);
CREATE POLICY "anon_delete_recovery_scores" ON public.recovery_scores FOR DELETE USING (true);

CREATE INDEX idx_recovery_scores_date ON public.recovery_scores(date);


-- ============================================
--  4. NUTRITION_PROFILE  (nutrition tab)
--  User's body stats & training phase
-- ============================================
CREATE TABLE public.nutrition_profile (
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

CREATE POLICY "anon_select_nutrition_profile" ON public.nutrition_profile FOR SELECT USING (true);
CREATE POLICY "anon_insert_nutrition_profile" ON public.nutrition_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_nutrition_profile" ON public.nutrition_profile FOR UPDATE USING (true);
CREATE POLICY "anon_delete_nutrition_profile" ON public.nutrition_profile FOR DELETE USING (true);


-- ============================================
--  5. WEIGHT_LOGS  (nutrition tab / weight tab)
--  Daily bodyweight entries
-- ============================================
CREATE TABLE public.weight_logs (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  weight     NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_weight_logs" ON public.weight_logs FOR SELECT USING (true);
CREATE POLICY "anon_insert_weight_logs" ON public.weight_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_weight_logs" ON public.weight_logs FOR UPDATE USING (true);
CREATE POLICY "anon_delete_weight_logs" ON public.weight_logs FOR DELETE USING (true);

CREATE INDEX idx_weight_logs_date ON public.weight_logs(date);


-- ============================================
--  6. EXERCISES  (gym tab)
--  Exercise library
-- ============================================
CREATE TABLE public.exercises (
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

CREATE POLICY "anon_select_exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "anon_insert_exercises" ON public.exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_exercises" ON public.exercises FOR UPDATE USING (true);
CREATE POLICY "anon_delete_exercises" ON public.exercises FOR DELETE USING (true);


-- ============================================
--  7. WORKOUT_SESSIONS  (gym tab)
--  One row per day the user trains
-- ============================================
CREATE TABLE public.workout_sessions (
  id         BIGSERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  completed  BOOLEAN DEFAULT false,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_workout_sessions" ON public.workout_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_workout_sessions" ON public.workout_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_workout_sessions" ON public.workout_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_workout_sessions" ON public.workout_sessions FOR DELETE USING (true);

CREATE INDEX idx_workout_sessions_date ON public.workout_sessions(date);


-- ============================================
--  8. SESSION_SETS  (gym tab)
--  Individual sets within a workout session
-- ============================================
CREATE TABLE public.session_sets (
  id          BIGSERIAL PRIMARY KEY,
  session_id  BIGINT REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id BIGINT REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number  INTEGER,
  reps        INTEGER,
  weight      NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_session_sets" ON public.session_sets FOR SELECT USING (true);
CREATE POLICY "anon_insert_session_sets" ON public.session_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_session_sets" ON public.session_sets FOR UPDATE USING (true);
CREATE POLICY "anon_delete_session_sets" ON public.session_sets FOR DELETE USING (true);

CREATE INDEX idx_session_sets_session  ON public.session_sets(session_id);
CREATE INDEX idx_session_sets_exercise ON public.session_sets(exercise_id);


-- ============================================
--  9. MESOCYCLES  (gym tab)
--  Training cycle config
-- ============================================
CREATE TABLE public.mesocycles (
  id           BIGSERIAL PRIMARY KEY,
  start_date   TEXT NOT NULL,
  length_weeks INTEGER DEFAULT 4,
  current_week INTEGER DEFAULT 1,
  phase        TEXT DEFAULT 'accumulation',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_mesocycles" ON public.mesocycles FOR SELECT USING (true);
CREATE POLICY "anon_insert_mesocycles" ON public.mesocycles FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_mesocycles" ON public.mesocycles FOR UPDATE USING (true);
CREATE POLICY "anon_delete_mesocycles" ON public.mesocycles FOR DELETE USING (true);


-- ============================================
--  10. STALL_TRACKING  (gym tab)
--  Tracks stalled progression per exercise
-- ============================================
CREATE TABLE public.stall_tracking (
  id               BIGSERIAL PRIMARY KEY,
  exercise_id      BIGINT REFERENCES public.exercises(id) ON DELETE CASCADE UNIQUE,
  sessions_stalled INTEGER DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stall_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_stall_tracking" ON public.stall_tracking FOR SELECT USING (true);
CREATE POLICY "anon_insert_stall_tracking" ON public.stall_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_stall_tracking" ON public.stall_tracking FOR UPDATE USING (true);
CREATE POLICY "anon_delete_stall_tracking" ON public.stall_tracking FOR DELETE USING (true);


-- ============================================
--  11. TDEE_ESTIMATES  (nutrition tab)
--  Daily TDEE calculations stored for trend tracking
-- ============================================
CREATE TABLE public.tdee_estimates (
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

CREATE POLICY "anon_select_tdee_estimates" ON public.tdee_estimates FOR SELECT USING (true);
CREATE POLICY "anon_insert_tdee_estimates" ON public.tdee_estimates FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_tdee_estimates" ON public.tdee_estimates FOR UPDATE USING (true);
CREATE POLICY "anon_delete_tdee_estimates" ON public.tdee_estimates FOR DELETE USING (true);

CREATE INDEX idx_tdee_estimates_date ON public.tdee_estimates(date);


-- ============================================
--  12. PROGRESS_PHOTOS  (weight tab)
--  Metadata for progress photos stored in Supabase Storage
--  Images go to bucket: 'progress-photos'
-- ============================================
CREATE TABLE public.progress_photos (
  id           BIGSERIAL PRIMARY KEY,
  date         TEXT NOT NULL,
  date_upper    TEXT,
  weight_lbs    NUMERIC,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_progress_photos" ON public.progress_photos FOR SELECT USING (true);
CREATE POLICY "anon_insert_progress_photos" ON public.progress_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_progress_photos" ON public.progress_photos FOR UPDATE USING (true);
CREATE POLICY "anon_delete_progress_photos" ON public.progress_photos FOR DELETE USING (true);

CREATE INDEX idx_progress_photos_date ON public.progress_photos(date);


-- ═══════════════════════════════════════════════════════════════
--  ⚠️  STORAGE BUCKET — Run storage-setup.sql separately!
--  Progress photos use Supabase Storage. You MUST also run
--  the storage-setup.sql file in your Supabase SQL Editor to
--  create the 'progress-photos' bucket with anon RLS policies.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
--  VERIFY — run this after to confirm everything is correct:
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables 
--   WHERE table_schema = 'public' ORDER BY table_name;
