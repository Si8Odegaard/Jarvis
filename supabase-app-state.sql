-- ============================================================
--  app_state — the key/value table every dashboard tab syncs through
--
--  DOCUMENTATION ONLY. This is not part of the Vercel build and the
--  deploy does not run it. The table already exists in the project the
--  app talks to (cskbbioyniryonkukamw); this file records its shape and
--  policies so the schema can be recreated or audited.
--
--  Rows used by the current tabs:
--    offseason_home       — the whole Home tab (days, tests, open items)
--    offseason_nutrition  — the whole Fuel tab (days, targets)
--    latest_weight        — newest weigh-in + 14-day rate, quoted by Jarvis
--
--  Everything else in app_state (dashboard, stack, water, acwr, …) is
--  written by older pages or by utils.js and is not read by Home/Fuel.
-- ============================================================

create table if not exists public.app_state (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Single permissive policy: this is a personal dashboard with no accounts, and
-- the browser only ever holds the public anon key.
drop policy if exists "app_state anon all" on public.app_state;
create policy "app_state anon all" on public.app_state
  for all to anon, authenticated
  using (true) with check (true);
