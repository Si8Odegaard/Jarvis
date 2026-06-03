// phase.js — Single Phase Authority
// All tabs import this to get the current training phase.
// Exposes: window.getCurrentPhase(sb), window.getGymPhaseConfig(phase), window.setPhaseOverride(sb, ...)

'use strict';

const PHASE_CONFIG = {
  PRESEASON_DATE: '2026-08-01',
  START_DATE: '2026-06-01',
  blocks: [
    { name: 'Foundation', weeks: 2, goal: 'Build mass and movement quality.' },
    { name: 'Strength-Speed', weeks: 2, goal: 'Convert muscle to power. Heavier gym, add plyometrics.' },
    { name: 'Power-Speed', weeks: 2, goal: 'Express power & speed. Max velocity sprints, game-realistic ball work.' },
    { name: 'Taper', weeks: 1, goal: 'Drop volume 35%. Arrive fresh and sharp for pre-season.' }
  ]
};

const GYM_PHASE_CONFIG = {
  'Foundation': {
    goal: 'Building the mass base that Power-Speed will convert to explosiveness',
    compoundReps: [8, 12], accessoryReps: [10, 15],
    compoundSets: 4, accessorySets: 3,
    sessionsPerWeek: 4, volumeMultiplier: 1.0
  },
  'Strength-Speed': {
    goal: 'Converting mass to relative strength — heavier reps, more sets',
    compoundReps: [4, 6], accessoryReps: [8, 10],
    compoundSets: 5, accessorySets: 3,
    sessionsPerWeek: 4, volumeMultiplier: 0.9
  },
  'Power-Speed': {
    goal: 'Expressing strength as explosive power — max intent on every rep',
    compoundReps: [3, 5], accessoryReps: [6, 8],
    compoundSets: 4, accessorySets: 3,
    sessionsPerWeek: 3, volumeMultiplier: 0.75,
    plyoPairings: {
      'Smith Machine Back Squat': { name: 'Broad Jump', sets: 5, reps: 3, note: 'Max intent after each squat set' },
      'DB Bulgarian Split Squat': { name: 'Single-Leg Bound', sets: 4, reps: 4, note: 'Each leg, max distance' },
      'Smith Machine Bench Press': { name: 'Plyo Push-Up', sets: 4, reps: 6, note: 'Clap push-ups if able' }
    }
  },
  'Taper': {
    goal: 'Neural freshness — maintain adaptations, reduce fatigue',
    compoundReps: [3, 5], accessoryReps: [6, 8],
    compoundSets: 3, accessorySets: 2,
    sessionsPerWeek: 2, volumeMultiplier: 0.6,
    weightMultiplier: 0.8
  },
  'Pre-Season': {
    goal: 'Maintenance mode — recovery and freshness over progression',
    compoundReps: [3, 5], accessoryReps: [6, 8],
    compoundSets: 3, accessorySets: 2,
    sessionsPerWeek: 2, volumeMultiplier: 0.5,
    weightMultiplier: 0.875
  },
  'In-Season': {
    goal: 'Maintenance — protect freshness for matches',
    compoundReps: [3, 5], accessoryReps: [6, 8],
    compoundSets: 3, accessorySets: 2,
    sessionsPerWeek: 2, volumeMultiplier: 0.5,
    weightMultiplier: 0.875
  }
};

if (typeof window !== 'undefined') {

  // ── MAIN: Get current phase ──
  window.getCurrentPhase = async function(sb) {
    if (!sb) return _computePhase(new Date());

    // Check for cached/override phase in app_state
    try {
      const { data } = await sb.from('app_state')
        .select('data')
        .eq('key', 'current_offseason_phase')
        .maybeSingle();

      if (data?.data) {
        const cached = data.data;
        const now = Date.now();

        // Manual overrides expire after 24 hours
        if (cached.manual_override && cached.override_expires && now < cached.override_expires) {
          return { ...cached.result, isOverride: true };
        }

        // Non-override cache valid for 24 hours
        const cacheAge = now - (cached.computed_at || 0);
        const CACHE_TTL = 24 * 60 * 60 * 1000;
        if (cacheAge < CACHE_TTL && !cached.manual_override) {
          return { ...cached.result, isOverride: false };
        }
      }
    } catch(e) { /* fall through to compute */ }

    // Compute fresh from date
    const result = _computePhase(new Date());

    // Write back to app_state for cross-tab sync
    try {
      await sb.from('app_state').upsert({
        key: 'current_offseason_phase',
        data: { result, computed_at: Date.now(), manual_override: false },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      // Also write gym phase config for the gym tab
      const gymConfig = GYM_PHASE_CONFIG[result.phase] || GYM_PHASE_CONFIG['Foundation'];
      await sb.from('app_state').upsert({
        key: 'gym_phase_config',
        data: { phase: result.phase, phaseWeek: result.phaseWeek, ...gymConfig },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      // Simplified keys for quick reads
      await sb.from('app_state').upsert({
        key: 'current_phase_week', data: { week: result.phaseWeek },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      await sb.from('app_state').upsert({
        key: 'days_to_preseason', data: { days: result.daysToPreseason },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch(e) { /* non-critical — tabs compute locally if write fails */ }

    return { ...result, isOverride: false };
  };

  // ── Core computation (no Supabase dependency) ──
  function _computePhase(now) {
    const preseason = new Date(PHASE_CONFIG.PRESEASON_DATE + 'T00:00:00');
    const start = new Date(PHASE_CONFIG.START_DATE + 'T00:00:00');

    if (now >= preseason) {
      return {
        phase: 'In-Season', phaseWeek: 1, daysToPreseason: 0,
        blockDay: (now.getDay() || 7), totalWeeks: 1, daysLeftInBlock: 0,
        goal: 'Maintain strength, protect freshness for matches.'
      };
    }

    const daysToPreseason = Math.max(0, Math.ceil((preseason - now) / 86400000));

    // Pre-season transition window (July 28-31)
    const preSeasonStart = new Date(preseason);
    preSeasonStart.setDate(preSeasonStart.getDate() - 4);
    if (now >= preSeasonStart && now < preseason) {
      return {
        phase: 'Pre-Season', phaseWeek: 1, daysToPreseason,
        blockDay: (now.getDay() || 7), totalWeeks: 1, daysLeftInBlock: Math.max(0, daysToPreseason),
        goal: 'Transition week — individual work when recovery allows.'
      };
    }

    let dayOffset = Math.floor((now - start) / 86400000);
    if (dayOffset < 0) dayOffset = 0;

    let weekAccum = 0;
    for (const block of PHASE_CONFIG.blocks) {
      const blockDays = block.weeks * 7;
      if (dayOffset < weekAccum * 7 + blockDays) {
        const weekInBlock = Math.floor((dayOffset - weekAccum * 7) / 7) + 1;
        const blockDay = ((dayOffset - weekAccum * 7) % 7) + 1;
        const daysLeftInBlock = block.weeks * 7 - ((dayOffset - weekAccum * 7) + 1);
        return {
          phase: block.name, phaseWeek: weekInBlock, daysToPreseason,
          blockDay, goal: block.goal, totalWeeks: block.weeks,
          daysLeftInBlock: Math.max(0, daysLeftInBlock)
        };
      }
      weekAccum += block.weeks;
    }

    // Past all blocks
    return {
      phase: 'Pre-Season', phaseWeek: 1, daysToPreseason,
      blockDay: (now.getDay() || 7), totalWeeks: 1, daysLeftInBlock: Math.max(0, daysToPreseason),
      goal: 'Transition week — individual work when recovery allows.'
    };
  }

  // ── Get gym programming for a given phase ──
  window.getGymPhaseConfig = function(phaseName) {
    return GYM_PHASE_CONFIG[phaseName] || GYM_PHASE_CONFIG['Foundation'];
  };

  // ── Write a manual phase override (used by soccer tab's extend/advance buttons) ──
  // overrideDays: positive = slow down (extend), negative = speed up (advance)
  window.setPhaseOverride = async function(sb, overrideDays) {
    const adjustedDate = new Date();
    adjustedDate.setDate(adjustedDate.getDate() + overrideDays);
    const result = _computePhase(adjustedDate);

    try {
      await sb.from('app_state').upsert({
        key: 'current_offseason_phase',
        data: {
          result, computed_at: Date.now(),
          manual_override: true,
          override_expires: Date.now() + (24 * 60 * 60 * 1000), // 24-hour expiry
          override_days: overrideDays
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch(e) {}

    return { ...result, isOverride: true };
  };
}
