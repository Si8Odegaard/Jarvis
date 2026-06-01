-- calendar-schema.sql
-- Match and Training Calendar — calendar_events table
-- Run this in Supabase SQL Editor

-- 1. Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,                           -- YYYY-MM-DD
  event_type TEXT NOT NULL DEFAULT 'gym',       -- match, gym, field, rest, recovery, travel, work
  title TEXT NOT NULL DEFAULT '',
  notes TEXT,
  duration_minutes INTEGER,
  opponent TEXT,                                -- for match events
  location TEXT,                                -- for match / travel events
  home_or_away TEXT DEFAULT 'home',             -- home, away
  work_hours NUMERIC(3,1),                      -- for work events
  equipment_available TEXT DEFAULT 'full',      -- full, limited, none
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "anon_insert_calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_calendar_events" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "anon_delete_calendar_events" ON public.calendar_events FOR DELETE USING (true);

CREATE INDEX idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX idx_calendar_events_type ON public.calendar_events(event_type);

-- 2. Enable realtime for live calendar sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
