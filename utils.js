// utils.js — Shared ACWR (Acute-to-Chronic Workload Ratio) Calculation
// Import this script in any tab that logs training sessions.
// Call: calculateACWR(supabaseClient) — writes results to app_state.

'use strict';

const INTENSITY_MULTIPLIERS = {
  light: 3,
  medium: 5,
  hard: 8,
  match: 9,
  // soccer_sessions intensity values
  Light: 3, Medium: 5, Hard: 8,
  'Maxed Out': 9, Cruised: 9, Competed: 9
};

const ACWR_THRESHOLDS = [
  { min: 0,     max: 0.6,  status: 'undertraining', color: 'red',
    msg: 'Training load very low — you are undertraining for your goals. Increase session frequency or intensity.' },
  { min: 0.6,   max: 0.8,  status: 'low',   color: 'yellow',
    msg: 'Slightly undertrained — consider adding one session this week.' },
  { min: 0.8,   max: 1.3,  status: 'optimal', color: 'green',
    msg: 'Optimal training zone — continue current load.' },
  { min: 1.3,   max: 1.5,  status: 'high', color: 'yellow',
    msg: 'Approaching overload — monitor closely, do not increase load this week.' },
  { min: 1.5,   max: Infinity, status: 'danger', color: 'red',
    msg: 'Injury risk zone — mandatory load reduction. Remove one high-intensity session this week. This is not optional.' }
];

/**
 * Calculate load score for a single session.
 * @param {number} durationMinutes
 * @param {string} intensity - "Light"|"Medium"|"Hard" or match specific
 * @param {boolean} isMatch - true for match events
 * @returns {number} load score
 */
function sessionLoad(durationMinutes, intensity, isMatch) {
  const mins = parseInt(durationMinutes) || 0;
  if (mins <= 0) return 0;
  const mult = isMatch ? INTENSITY_MULTIPLIERS.match
    : (INTENSITY_MULTIPLIERS[intensity] || INTENSITY_MULTIPLIERS.medium);
  return mins * mult;
}

/**
 * Main ACWR calculation. Reads session data from workout_sessions, soccer_sessions,
 * and calendar_events tables. Writes acwr, acute_load, chronic_load, and acwr_status
 * to app_state.
 *
 * @param {object} sb - Supabase client instance
 * @returns {Promise<object>} { acute_load, chronic_load, acwr, status, color, msg, vacationNote }
 */
async function calculateACWR(sb) {
  if (!sb) return null;

  const today = new Date().toISOString().slice(0, 10);
  const day28Ago = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const day7Ago  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    // Query all session tables in parallel
    const [soccerRes, gymRes, calRes, travelRes] = await Promise.all([
      sb.from('soccer_sessions').select('date,session_type,duration_minutes,intensity')
        .gte('date', day28Ago).order('date', { ascending: false }),
      sb.from('workout_sessions').select('date,completed')
        .gte('date', day28Ago).order('date', { ascending: false }),
      sb.from('calendar_events').select('date,event_type,duration_minutes,equipment_available')
        .gte('date', day28Ago).in('event_type', ['match','gym','field'])
        .order('date', { ascending: false }),
      sb.from('calendar_events').select('date,event_type,equipment_available')
        .gte('date', day7Ago).in('event_type', ['travel'])
    ]);

    const soccerSessions = soccerRes?.data || [];
    const gymSessions = gymRes?.data || [];
    const calendarEvents = calRes?.data || [];
    const travelEvents = travelRes?.data || [];

    // Build daily load map: { 'YYYY-MM-DD': loadScore }
    const dailyLoad = {};

    // Process soccer_sessions (ball, speed, gym, match, group)
    soccerSessions.forEach(s => {
      const isMatch = s.session_type === 'match';
      const load = sessionLoad(s.duration_minutes, s.intensity, isMatch);
      if (load > 0) {
        dailyLoad[s.date] = (dailyLoad[s.date] || 0) + load;
      }
    });

    // Process workout_sessions (no duration/intensity — default to 60 min Hard)
    gymSessions.forEach(s => {
      if (s.completed) {
        const load = sessionLoad(60, 'Hard', false); // 60min × 8 = 480
        dailyLoad[s.date] = (dailyLoad[s.date] || 0) + load;
      }
    });

    // Process calendar_events (matches, gym, field)
    calendarEvents.forEach(e => {
      const isMatch = e.event_type === 'match';
      const intensity = isMatch ? 'match' : 'Hard';
      const load = sessionLoad(e.duration_minutes || 60, intensity, isMatch);
      if (load > 0) {
        dailyLoad[e.date] = (dailyLoad[e.date] || 0) + load;
      }
    });

    // Build weekly load values for chronic calculation
    const allDates = Object.keys(dailyLoad).sort();
    const weeklyLoads = {};
    allDates.forEach(date => {
      const d = new Date(date + 'T00:00:00');
      // Get Monday of that week
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10);
      weeklyLoads[weekKey] = (weeklyLoads[weekKey] || 0) + dailyLoad[date];
    });

    // Acute load: sum of last 7 days
    let acuteLoad = 0;
    allDates.forEach(date => {
      if (date >= day7Ago) acuteLoad += dailyLoad[date];
    });

    // Chronic load: average of weekly loads over last 4 weeks
    const weekKeys = Object.keys(weeklyLoads).sort();
    const recentWeeks = weekKeys.slice(-4);
    let chronicLoad = 0;
    if (recentWeeks.length > 0) {
      const totalWeeklyLoad = recentWeeks.reduce((sum, wk) => sum + weeklyLoads[wk], 0);
      chronicLoad = totalWeeklyLoad / recentWeeks.length;
    }

    // ACWR = acute / chronic
    let acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : (acuteLoad > 0 ? 1.5 : 0);

    // Determine status from thresholds (acwr >= min, acwr < max)
    let status = 'undefined', color = 'gray', msg = 'No training data yet.';
    for (const t of ACWR_THRESHOLDS) {
      if (acwr >= t.min && acwr < t.max) {
        status = t.status;
        color = t.color;
        msg = t.msg;
        break;
      }
    }
    // Handle exactly at or above the last threshold's max (Infinity — never reached via <)

    // Vacation / moving period detection from travel calendar events
    let vacationNote = null;
    const recentTravel = travelEvents.filter(e => e.date >= day7Ago);
    if (recentTravel.length > 0) {
      const hasLimitedEquip = recentTravel.some(e => e.equipment_available === 'limited' || e.equipment_available === 'none');
      vacationNote = hasLimitedEquip
        ? 'Load reduction due to travel with limited equipment is expected — chronic load will recalibrate over 2 weeks. Maintain bodyweight work and conditioning to preserve fitness.'
        : 'Load reduction due to travel is expected — chronic load will recalibrate over 2 weeks. Maintain technical work and conditioning to preserve fitness.';
    }

    // Write results to app_state
    const acwrData = {
      acute_load: Math.round(acuteLoad),
      chronic_load: Math.round(chronicLoad),
      acwr: Math.round(acwr * 100) / 100,
      acwr_status: status,
      acwr_color: color,
      acwr_message: msg,
      vacation_note: vacationNote,
      calculated_at: new Date().toISOString()
    };

    await sb.from('app_state').upsert({
      key: 'acwr',
      data: acwrData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    return acwrData;
  } catch (e) {
    console.error('ACWR calculation error:', e);
    return null;
  }
}

// Expose on window for inline scripts in HTML files
if (typeof window !== 'undefined') {
  window.calculateACWR = calculateACWR;

  // ── Shared Gym Rotation Logic ──
  // Used by gym.html (gym tab) and index.html (dashboard morning brief)
  // Change these once to update both tabs.
  const MICROCYCLE_OFFSEASON = ['Lower Power','Upper Hypertrophy','Rest','Lower Hypertrophy & Lateral','Upper Power & Full Body','Rest','Rest'];
  const MICROCYCLE_INSEASON  = ['Lower (In-Season)','Rest','Upper (In-Season)','Rest','Rest','Rest','Rest'];
  const ROTATION_ANCHOR = { date:'2026-06-01', index: 0 };

  window.getGymDayName = function(gymMode) {
    const mode = gymMode || 'offseason';
    const anchor = new Date(ROTATION_ANCHOR.date + 'T00:00:00');
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    const nowDate = new Date(todayStr + 'T00:00:00');
    const diff = Math.round((nowDate - anchor) / 86400000);
    const idx = ((ROTATION_ANCHOR.index + diff) % 7 + 7) % 7;
    const cycle = mode === 'inseason' ? MICROCYCLE_INSEASON : MICROCYCLE_OFFSEASON;
    return cycle[idx];
  };

  window.getGymExerciseCount = function(gymDayName) {
    const exCounts = {
      'Lower Power':6, 'Upper Hypertrophy':9, 'Lower Hypertrophy & Lateral':8, 'Upper Power & Full Body':7,
      'Lower (In-Season)':5, 'Upper (In-Season)':5
    };
    return exCounts[gymDayName] || 0;
  };
}
