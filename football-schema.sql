-- football-schema.sql
-- Technical Development & Match Performance tables
-- Run this in Supabase SQL Editor

-- 1. Technical Sessions
CREATE TABLE IF NOT EXISTS public.technical_sessions (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  session_type TEXT NOT NULL,        -- wall_work, cone_dribbling, finishing, long_passing, pressing_patterns
  duration_minutes INTEGER NOT NULL,
  intensity TEXT DEFAULT 'medium',   -- light, medium, high
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 10),
  focus_areas JSONB DEFAULT '[]',    -- array of focus area strings
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.technical_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_technical_sessions" ON public.technical_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_technical_sessions" ON public.technical_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_technical_sessions" ON public.technical_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_technical_sessions" ON public.technical_sessions FOR DELETE USING (true);
CREATE INDEX idx_technical_sessions_date ON public.technical_sessions(date);

-- 2. Match Performances
CREATE TABLE IF NOT EXISTS public.match_performances (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  competition_type TEXT NOT NULL,    -- rec_league, friendly, trial, official
  minutes_played INTEGER,
  position TEXT,
  result TEXT,                       -- win, loss, draw
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
CREATE POLICY "anon_select_match_performances" ON public.match_performances FOR SELECT USING (true);
CREATE POLICY "anon_insert_match_performances" ON public.match_performances FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_match_performances" ON public.match_performances FOR UPDATE USING (true);
CREATE POLICY "anon_delete_match_performances" ON public.match_performances FOR DELETE USING (true);
CREATE INDEX idx_match_performances_date ON public.match_performances(date);

ALTER PUBLICATION supabase_realtime ADD TABLE public.technical_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_performances;
