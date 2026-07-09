-- ═══════════════════════════════════════════════════════════════
--  PUSH_SUBSCRIPTIONS — Web Push API subscription store
--  Run this ONCE in your Supabase SQL Editor.
--
--  Stores one row per device/browser that opts in to meal-reminder
--  push notifications. The web-push library needs the full
--  subscription JSON (endpoint + keys.p256dh + keys.auth) to send
--  a notification to that specific device.
--
--  Rows are marked `active = false` (not deleted) when Vercel
--  push returns 404/410 Gone, so we keep a history of unsubscribed
--  devices and don't immediately re-notify them if they re-subscribe
--  from the same browser.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id                   BIGSERIAL PRIMARY KEY,
  subscription_json    JSONB NOT NULL,
  user_label           TEXT,                          -- e.g. "iPhone 15 Safari" (for debugging)
  user_agent           TEXT,                          -- full UA string at opt-in time
  active               BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at     TIMESTAMPTZ,
  deactivated_at       TIMESTAMPTZ,
  deactivation_reason  TEXT                           -- e.g. '410_gone', 'user_disabled'
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anon users can read/write their own subscription rows. Since this is a
-- single-user dashboard (no auth), we keep the same anon policy as the
-- rest of the app. If multi-user auth is added later, restrict by user_id.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_push_subscriptions' AND tablename = 'push_subscriptions') THEN
    CREATE POLICY "anon_select_push_subscriptions"  ON public.push_subscriptions FOR SELECT USING (true);
    CREATE POLICY "anon_insert_push_subscriptions"  ON public.push_subscriptions FOR INSERT WITH CHECK (true);
    CREATE POLICY "anon_update_push_subscriptions"  ON public.push_subscriptions FOR UPDATE USING (true);
    CREATE POLICY "anon_delete_push_subscriptions"  ON public.push_subscriptions FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active   ON public.push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created  ON public.push_subscriptions(created_at);


-- ═══════════════════════════════════════════════════════════════
--  VERIFY
-- ═══════════════════════════════════════════════════════════════
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'push_subscriptions'
--   ORDER BY ordinal_position;
