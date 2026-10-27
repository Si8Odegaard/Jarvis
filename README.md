# Offseason

A single-user off-season tracker for one soccer program. Static site — no framework, no bundler. `index.html` is a shell that lazy-loads each tab in an iframe, and everything is stored in `localStorage` and mirrored to one Supabase table.

## Tabs

- **Home** (`home.html`) — the training plan week by week, morning check-in, session log, weekly load (session load / sprint distance / volume-load) with week-aware ceilings and a Week 4 deload target, ACWR once four weeks of history exist, test and retest cards, baselines, open items.
- **Health** (`stack.html`) — the daily supplement checklist, grouped by morning / lunch / evening, plus the meal-reminder push subscription card.
- **Fuel** (`nutrition.html`) — one set of calorie / carb / protein totals and one weigh-in per day, with verdicts, weight and calorie charts, a block-by-week table and CSV export.

## Sync

Each tab owns one `app_state` key and writes the whole blob to it:

| Tab | localStorage | `app_state` key |
|---|---|---|
| Home | `ot_home_v1` | `offseason_home` |
| Health | `stack:*` | `stack` |
| Fuel | `ot_nutrition_v1` | `offseason_nutrition` |

Conflicts are last-writer-wins by each blob's `updated` timestamp. Home and Fuel poll every 60 s; Health uses a realtime subscription on its row. `supabase-app-state.sql` records the table's shape — it is documentation, not part of the build.

## Deploy

```bash
./deploy.sh
```

Commits everything, pushes to `origin/main`, and fails loudly if the push is a no-op. Vercel then runs `node build.js` (which writes `env.js` from project env vars) and serves the repo root. `sw.js` is cache-first, so **any change to a cached file needs its `CACHE` version bumped**, or installed clients keep the old copy. Push reminders additionally need `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`, `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Vercel, and the cron in `vercel.json` calls `/api/send-reminder`.
