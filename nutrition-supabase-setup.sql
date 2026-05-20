-- ============================================
-- Nutrition & Recovery Tab - Supabase Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  sleep_hours NUMERIC,
  sleep_quality INTEGER,
  energy_score INTEGER,
  soreness TEXT,
  protein_grams INTEGER,
  hydration TEXT,
  calorie_hit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recovery_scores table
CREATE TABLE IF NOT EXISTS recovery_scores (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  score INTEGER,
  sleep_component NUMERIC,
  quality_component NUMERIC,
  energy_component NUMERIC,
  soreness_component NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tdee_estimates table
CREATE TABLE IF NOT EXISTS tdee_estimates (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  estimated_tdee INTEGER,
  weight_used NUMERIC,
  adjustment_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nutrition_profile table
CREATE TABLE IF NOT EXISTS nutrition_profile (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT 'default',
  age INTEGER,
  height_cm NUMERIC,
  training_frequency INTEGER,
  phase TEXT,
  goal_weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdee_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_checkins (allow all operations for authenticated users)
CREATE POLICY "Users can view all daily_checkins"
  ON daily_checkins FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert daily_checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update daily_checkins"
  ON daily_checkins FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete daily_checkins"
  ON daily_checkins FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for recovery_scores (allow all operations for authenticated users)
CREATE POLICY "Users can view all recovery_scores"
  ON recovery_scores FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert recovery_scores"
  ON recovery_scores FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update recovery_scores"
  ON recovery_scores FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete recovery_scores"
  ON recovery_scores FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for tdee_estimates (allow all operations for authenticated users)
CREATE POLICY "Users can view all tdee_estimates"
  ON tdee_estimates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tdee_estimates"
  ON tdee_estimates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tdee_estimates"
  ON tdee_estimates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete tdee_estimates"
  ON tdee_estimates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for nutrition_profile (allow all operations for authenticated users)
CREATE POLICY "Users can view all nutrition_profiles"
  ON nutrition_profile FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert nutrition_profiles"
  ON nutrition_profile FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update nutrition_profiles"
  ON nutrition_profile FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete nutrition_profiles"
  ON nutrition_profile FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_date ON recovery_scores(date);
CREATE INDEX IF NOT EXISTS idx_tdee_estimates_date ON tdee_estimates(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_profile_user ON nutrition_profile(user_id);

-- ============================================
-- Instructions
-- ============================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The app_state table should already exist from your other tabs
-- 3. The nutrition tab will write recovery_score_today and recovery_score_7day_avg to app_state
-- 4. Enable anon access in your Supabase project settings if you want public access
