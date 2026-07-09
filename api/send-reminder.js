// ════════════════════════════════════════════════════════════
//  VERCEL SERVERLESS FUNCTION — /api/send-reminder
//
//  Triggered by Vercel Cron (configured in vercel.json).
//  Reads all active push_subscriptions rows from Supabase
//  and sends a hardcoded "Reminder test" push to each.
//
//  v1 — INFRASTRUCTURE ONLY. The smart meal-gap logic
//  (3x/day timed nudges based on missing food_logs windows)
//  will be added in the next prompt, once this skeleton
//  is confirmed working end-to-end on the user's iPhone.
//
//  Required Vercel env vars (set in Vercel dashboard):
//    - VAPID_PUBLIC_KEY     (VAPID public key, from `npx web-push generate-vapid-keys`)
//    - VAPID_PRIVATE_KEY    (VAPID private key, same source)
//    - VAPID_SUBJECT        (mailto: or https:// URL identifying your push server)
//    - SUPABASE_URL         (your project URL, e.g. https://xxx.supabase.co)
//    - SUPABASE_SERVICE_KEY (service-role key, NOT anon — needed for full table read/write)
// ════════════════════════════════════════════════════════════

const webpush = require('web-push');

// Supabase REST helpers (no SDK dep — fetch is built-in to Node 18+)
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT     || 'mailto:admin@jarvis.local',
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Test payload — replaced by smart meal-gap content in the next prompt
const TEST_PAYLOAD = JSON.stringify({
  title: 'Reminder test',
  body:  'Jarvis meal reminders are working ✓',
  url:   '/'
});

async function sbFetch(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`Supabase ${path} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbPatch(path, body, opts = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (opts.prefer) headers.Prefer = opts.prefer;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase PATCH ${path} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

module.exports = async (req, res) => {
  const t0 = Date.now();

  // Guard: Vercel Cron sends GET by default — accept any method,
  // but block non-Vercel callers via the standard Authorization header check.
  // (Cron Jobs configured in vercel.json send a Bearer token automatically
  //  via the CRON_SECRET env var if you want to enforce it. Skipped for v1.)

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'VAPID keys not configured — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Vercel env vars.',
    });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'Supabase env vars not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
    });
  }

  // 1) Read all active subscriptions
  let subs;
  try {
    subs = await sbFetch('push_subscriptions?active=eq.true&select=id,subscription_json,user_label');
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Failed to read push_subscriptions: ' + e.message });
  }

  if (!subs || subs.length === 0) {
    return res.status(200).json({
      ok: true,
      sent: 0,
      removed: 0,
      message: 'No active subscriptions.',
      durationMs: Date.now() - t0,
    });
  }

  // 2) Send to each, capture per-subscription results
  const results = [];
  const toRemove = [];  // 410 Gone → mark inactive

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription_json, TEST_PAYLOAD);
      results.push({ id: sub.id, label: sub.user_label || null, ok: true });
    } catch (e) {
      const status = e.statusCode || 0;
      if (status === 404 || status === 410) {
        // Subscription expired or unsubscribed — mark inactive
        toRemove.push(sub.id);
        results.push({ id: sub.id, label: sub.user_label || null, ok: false, reason: 'gone', status });
      } else {
        results.push({ id: sub.id, label: sub.user_label || null, ok: false, reason: e.message, status });
      }
    }
  }

  // 3) Mark dead subscriptions inactive in Supabase
  if (toRemove.length) {
    try {
      await sbPatch(
        `push_subscriptions?id=in.(${toRemove.join(',')})`,
        { active: false, deactivated_at: new Date().toISOString(), deactivation_reason: '410_gone' },
        { prefer: 'return=minimal' }
      );
    } catch (e) {
      // Non-fatal — log and continue
      console.error('[send-reminder] failed to mark dead subs inactive:', e.message);
    }
  }

  const sent = results.filter(r => r.ok).length;
  const failed = results.length - sent;

  return res.status(200).json({
    ok: true,
    sent,
    failed,
    removed: toRemove.length,
    durationMs: Date.now() - t0,
    results,
  });
};
