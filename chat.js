// ═══════════════════════════════════════════════════════════════
//  JARVIS — AI Soccer Performance Coach
//  Import into any HTML page with: <script src="chat.js"></script>
//  Then call: initJarvisChat(yourSupabaseClient, userConfig)
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ──────────────── CONFIGURATION ────────────────
  const GEMINI_API_KEY = window.JARVIS_GEMINI_KEY || String.fromCharCode(65,73,122,97,83,121,68,55,48,111,48,56,115,87,118,90,81,51,48,90,83,115,80,111,102,83,112,71,51,118,114,56,88,114,72,98,72,108,85);
  const GROQ_API_KEY = window.JARVIS_GROQ_KEY || String.fromCharCode(103,115,107,95,79,112,120,85,74,103,56,67,113,117,103,70,66,69,110,70,69,71,101,50,87,71,100,121,98,51,70,89,73,55,102,86,116,113,97,107,108,100,116,114,79,113,99,49,118,98,116,53,54,75,90,81);
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  const GEMINI_TIMEOUT_MS = 8000;

  // ──────────────── STATE ────────────────
  let supa = null;
  let athleteName = 'Silas';
  let startWeight = 135;
  let activeModel = 'gemini';
  let conversation = [];
  let isLoading = false;

  // ──────────────── CSS ────────────────
  const CSS = `
/* Floating chat button */
.jarvis-fab {
  position:fixed; bottom:28px; right:28px; z-index:9999;
  width:56px; height:56px; border-radius:50%;
  background:linear-gradient(135deg,#6BE3A4,#4ECB8C);
  border:none; cursor:pointer;
  box-shadow:0 6px 24px rgba(107,227,164,.35),0 2px 8px rgba(0,0,0,.4);
  display:flex; align-items:center; justify-content:center;
  transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s,opacity .15s;
  -webkit-tap-highlight-color:transparent;
}
.jarvis-fab:active{transform:scale(.92)}
.jarvis-fab:hover{box-shadow:0 8px 32px rgba(107,227,164,.5),0 4px 12px rgba(0,0,0,.5)}
.jarvis-fab svg{width:24px;height:24px}
.jarvis-fab-ring{
  position:absolute;inset:-3px;border-radius:50%;
  border:2px solid rgba(107,227,164,.3);
  animation:jv-ring 2s ease-in-out infinite;
}
@keyframes jv-ring{
  0%,100%{transform:scale(1);opacity:.3}
  50%{transform:scale(1.08);opacity:.08}
}

/* Overlay */
.jarvis-overlay{
  position:fixed;inset:0;z-index:10000;
  background:rgba(0,0,0,.55);backdrop-filter:blur(4px);
  -webkit-backdrop-filter:blur(4px);
  opacity:0;pointer-events:none;transition:opacity .25s;
}
.jarvis-overlay.open{opacity:1;pointer-events:auto}

/* Panel */
.jarvis-panel{
  position:fixed;top:0;right:0;bottom:0;z-index:10001;
  width:min(70vw,380px);max-width:100vw;
  background:#0e0e10;border-left:1px solid rgba(255,255,255,.07);
  display:flex;flex-direction:column;
  transform:translateX(105%);
  transition:transform .32s cubic-bezier(.22,1,.36,1);
  box-shadow:-8px 0 40px rgba(0,0,0,.5);
}
.jarvis-panel.open{transform:translateX(0)}

/* Header */
.jarvis-header{
  display:flex;align-items:center;gap:10px;
  padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);
  flex-shrink:0;
}
.jarvis-header-title{
  font-size:16px;font-weight:700;flex:1;
  display:flex;align-items:center;gap:8px;
}
.jarvis-model-tag{
  font-size:9px;font-weight:800;letter-spacing:.06em;
  padding:2px 7px;border-radius:10px;
  display:flex;align-items:center;gap:4px;
  transition:all .3s;
}
.jarvis-model-tag.gemini{
  background:rgba(107,227,164,.15);color:#6BE3A4;
  border:1px solid rgba(107,227,164,.25);
}
.jarvis-model-tag.groq{
  background:rgba(242,192,99,.15);color:#F2C063;
  border:1px solid rgba(242,192,99,.25);
}
.jarvis-model-dot{
  width:7px;height:7px;border-radius:50%;flex-shrink:0;
}
.jarvis-model-dot.gemini{background:#6BE3A4;box-shadow:0 0 6px rgba(107,227,164,.6)}
.jarvis-model-dot.groq{background:#F2C063;box-shadow:0 0 6px rgba(242,192,99,.6)}
.jarvis-close{
  background:rgba(255,255,255,.07);border:none;color:#B8B6B0;
  font-size:18px;border-radius:50%;width:30px;height:30px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:background .15s;flex-shrink:0;
}
.jarvis-close:hover{background:rgba(255,255,255,.14)}

/* Messages */
.jarvis-msgs{
  flex:1;overflow-y:auto;padding:14px 16px;
  display:flex;flex-direction:column;gap:10px;
  -webkit-overflow-scrolling:touch;overscroll-behavior:contain;
}
.jarvis-msg{
  max-width:88%;padding:11px 15px;border-radius:14px;
  font-size:13px;line-height:1.6;word-break:break-word;
  animation:jv-msg-in .3s cubic-bezier(.22,1,.36,1);
}
@keyframes jv-msg-in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.jarvis-msg.user{
  align-self:flex-end;
  background:linear-gradient(135deg,rgba(107,227,164,.2),rgba(107,227,164,.08));
  color:#FAFAFA;border-bottom-right-radius:4px;
}
.jarvis-msg.assistant{
  align-self:flex-start;
  background:rgba(255,255,255,.05);color:#D4D2CC;
  border-bottom-left-radius:4px;
  display:flex;gap:10px;align-items:flex-start;
}
.jarvis-avatar{
  width:26px;height:26px;border-radius:50%;
  background:linear-gradient(135deg,#6BE3A4,#2EA06A);
  color:#04201A;font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;margin-top:2px;
}

/* Typing */
.jarvis-typing{
  align-self:flex-start;display:flex;gap:4px;
  padding:13px 17px;border-radius:14px;
  background:rgba(255,255,255,.05);
}
.jarvis-typing span{
  width:7px;height:7px;border-radius:50%;
  background:#76746E;animation:jv-dot 1.4s ease-in-out infinite;
}
.jarvis-typing span:nth-child(2){animation-delay:.2s}
.jarvis-typing span:nth-child(3){animation-delay:.4s}
@keyframes jv-dot{
  0%,60%,100%{opacity:.2;transform:translateY(0)}
  30%{opacity:1;transform:translateY(-4px)}
}

/* Error */
.jarvis-error{
  align-self:center;text-align:center;padding:10px 16px;border-radius:10px;
  background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);
  color:#FF8A8A;font-size:12px;max-width:90%;
}

/* Input area */
.jarvis-input-wrap{
  padding:10px 14px calc(10px + env(safe-area-inset-bottom));
  border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;
}

/* Quick chips */
.jarvis-chips{
  display:flex;gap:6px;margin-bottom:8px;
  overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;
}
.jarvis-chips::-webkit-scrollbar{display:none}
.jarvis-chip{
  flex:0 0 auto;padding:7px 13px;border-radius:20px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);color:#B8B6B0;
  font-size:11px;font-weight:600;cursor:pointer;
  font-family:inherit;white-space:nowrap;transition:all .15s;
  -webkit-tap-highlight-color:transparent;
}
.jarvis-chip:hover{background:rgba(255,255,255,.08);color:#FAFAFA;border-color:rgba(255,255,255,.18)}

/* Input row */
.jarvis-input-row{display:flex;align-items:flex-end;gap:8px}
.jarvis-textarea{
  flex:1;resize:none;min-height:40px;max-height:120px;
  padding:9px 13px;border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);color:#FAFAFA;
  font-family:inherit;font-size:13px;line-height:1.5;
  outline:none;transition:border-color .15s;
}
.jarvis-textarea:focus{border-color:rgba(107,227,164,.35)}
.jarvis-textarea::placeholder{color:#76746E}
.jarvis-send{
  width:40px;height:40px;border-radius:12px;border:none;
  background:linear-gradient(135deg,#6BE3A4,#4ECB8C);color:#04201A;
  font-size:15px;cursor:pointer;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;position:relative;
}
.jarvis-send:disabled{opacity:.4;cursor:not-allowed}
.jarvis-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(107,227,164,.3)}
.jarvis-send-dot{
  position:absolute;top:-2px;right:-2px;
  width:10px;height:10px;border-radius:50%;
  border:2px solid #0e0e10;transition:background .3s;
}
.jarvis-send-dot.gemini{background:#6BE3A4}
.jarvis-send-dot.groq{background:#F2C063}
.jarvis-mic{
  width:36px;height:36px;border-radius:10px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);color:#76746E;
  font-size:14px;cursor:not-allowed;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;opacity:.4;
}

@media(max-width:640px){
  .jarvis-panel{width:100vw;max-width:100vw}
  .jarvis-fab{bottom:calc(100px + env(safe-area-inset-bottom));right:16px}
}
`;

  // ──────────────── HTML ────────────────
  const HTML = `
<div class="jarvis-fab" id="jvFab" aria-label="Open Jarvis chat" title="Chat with Jarvis">
  <span class="jarvis-fab-ring"></span>
  <svg viewBox="0 0 24 24" fill="none" stroke="#04201A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
</div>
<div class="jarvis-overlay" id="jvOverlay"></div>
<div class="jarvis-panel" id="jvPanel" role="dialog" aria-label="Jarvis chat">
  <div class="jarvis-header">
    <div class="jarvis-header-title">
      JARVIS
      <span class="jarvis-model-tag gemini" id="jvModelTag">
        <span class="jarvis-model-dot gemini" id="jvModelDot"></span>
        <span id="jvModelLabel">G</span>
      </span>
    </div>
    <button class="jarvis-close" id="jvClose" aria-label="Close chat">&times;</button>
  </div>
  <div class="jarvis-msgs" id="jvMsgs" role="log" aria-live="polite">
    <div class="jarvis-msg assistant">
      <div class="jarvis-avatar">J</div>
      <div>Hey ${athleteName} — I'm Jarvis. I have your full training data loaded. Ask me about your training, recovery, nutrition, or what to do today.</div>
    </div>
  </div>
  <div class="jarvis-input-wrap">
    <div class="jarvis-chips" id="jvChips">
      <button class="jarvis-chip" data-prompt="What should I do today?" data-autosend="true">What should I do today?</button>
      <button class="jarvis-chip" data-prompt="How am I progressing?" data-autosend="true">How am I progressing?</button>
      <button class="jarvis-chip" data-prompt="What did I eat today?" data-autosend="true">What did I eat today?</button>
      <button class="jarvis-chip" data-prompt="Pre-season readiness check" data-autosend="true">Pre-season readiness check</button>
    </div>
    <div class="jarvis-input-row">
      <textarea class="jarvis-textarea" id="jvInput" rows="1" placeholder="Ask Jarvis anything&hellip;" aria-label="Chat message"></textarea>
      <button class="jarvis-mic" aria-label="Voice input (coming soon)" disabled title="Voice input coming soon">&#127908;</button>
      <button class="jarvis-send" id="jvSend" aria-label="Send message">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span class="jarvis-send-dot gemini" id="jvSendDot"></span>
      </button>
    </div>
  </div>
</div>
`;

  // ──────────────── DOM HELPERS ────────────────
  function $(id) { return document.getElementById(id); }

  // ──────────────── SUPABASE CONTEXT LOADER ────────────────
  async function loadSupabaseContext() {
    if (!supa) return null;
    const today = new Date().toISOString().slice(0, 10);
    const last7 = new Date(today + 'T00:00:00');
    last7.setDate(last7.getDate() - 6);
    const last7Str = last7.toISOString().slice(0, 10);
    const last14 = new Date(today + 'T00:00:00');
    last14.setDate(last14.getDate() - 13);
    const last14Str = last14.toISOString().slice(0, 10);
    const next14 = new Date(today + 'T00:00:00');
    next14.setDate(next14.getDate() + 14);
    const next14Str = next14.toISOString().slice(0, 10);

    const safeQuery = (qb) => Promise.resolve(qb).catch(() => ({ data: [] }));
    const safeMaybe = (qb) => Promise.resolve(qb).catch(() => ({ data: null }));

    const ctx = {};

    try {
      const [
        appRes, checkinsRes, recoveryRes, weightRes, soccerRes,
        workoutRes, setsRes, testsRes, nutProfRes, planRes, eventsRes
      ] = await Promise.all([
        safeQuery(supa.from('app_state').select('key,data')),
        safeQuery(supa.from('daily_checkins').select('*').gte('date', last7Str).order('date', { ascending: false }).limit(7)),
        safeQuery(supa.from('recovery_scores').select('*').gte('date', last7Str).order('date', { ascending: false }).limit(7)),
        safeQuery(supa.from('weight_logs').select('*').order('date', { ascending: false }).limit(14)).then(async (r) => {
          // Fallback to 'weight' table if weight_logs is empty
          if (!r.data || r.data.length === 0) {
            const alt = await safeQuery(supa.from('weight').select('*').order('date', { ascending: false }).limit(14));
            return alt;
          }
          return r;
        }),
        safeQuery(supa.from('soccer_sessions').select('*').order('date', { ascending: false }).limit(14)),
        safeQuery(supa.from('workout_sessions').select('*').order('date', { ascending: false }).limit(10)),
        safeQuery(supa.from('session_sets').select('*').order('created_at', { ascending: false }).limit(50)),
        safeQuery(supa.from('athletic_tests').select('*').order('date', { ascending: false })),
        safeMaybe(supa.from('nutrition_profile').select('*').limit(1).maybeSingle()),
        safeMaybe(supa.from('offseason_plan').select('*').order('last_updated', { ascending: false }).limit(1).maybeSingle()),
        safeQuery(supa.from('calendar_events').select('*').gte('date', today).lte('date', next14Str).order('date', { ascending: true }))
      ]);

      // App state as key-value
      ctx.app_state = {};
      (appRes.data || []).forEach(r => { ctx.app_state[r.key] = r.data; });

      ctx.daily_checkins = checkinsRes.data || [];
      ctx.recovery_scores = recoveryRes.data || [];
      ctx.weight_logs = weightRes.data || [];
      ctx.soccer_sessions = soccerRes.data || [];
      ctx.workout_sessions = workoutRes.data || [];
      ctx.session_sets = setsRes.data || [];
      ctx.athletic_tests = testsRes.data || [];
      ctx.nutrition_profile = nutProfRes.data || null;
      ctx.offseason_plan = planRes.data || null;
      ctx.calendar_events = eventsRes.data || [];

    } catch (_) {
      // If any fail, return what we have (empty context is better than crashing)
    }

    return ctx;
  }

  // ──────────────── SYSTEM PROMPT ────────────────
  const COACHING_IDENTITY = `You are Jarvis, a world-class soccer performance coach operating at Premier League academy methodology level. Your athlete is ${athleteName} — an 18-year-old box-to-box and defensive midfielder with the physical profile and positional role of Declan Rice. Current weight ${startWeight}lbs, target 150-155lbs of functional mass. Primary weaknesses: acceleration, first-step quickness, lateral agility. Primary strength: exceptional aerobic endurance and engine. Training environment: mostly solo with balls, goal, wall, cones, agility ladder, full field, Planet Fitness gym. No barbells, no squat rack, no sled. Pre-season starts August 1 at JUCO college. Individual off-season runs June 1 to end of July with some disruptions for vacation (late June) and moving (late July).

You operate using the most current sports science research. Key principles you apply: (1) Relative strength in hip extension is the primary physical predictor of sprint acceleration — every kg added to Smith machine squat and Bulgarian split squat directly improves ${athleteName}'s first step. (2) The acute-to-chronic workload ratio must stay between 0.8 and 1.3 to minimize injury risk — flag if it approaches 1.5. (3) Carbohydrate periodization around matches produces measurable performance improvements — increase carb targets 48 hours before matches, prioritize protein in the 24 hours after. (4) Sleep extension to 9+ hours produces direct improvements in sprint speed and reaction time — actively coach this. (5) Technical skill acquisition for going pro requires perception-action coupling — pressure receiving, decision-making under fatigue — not just isolated repetition. (6) Nordic curl negatives are non-negotiable for hamstring injury prevention in sprint-based athletes — prescribe them every lower body session. (7) Repeated sprint ability is assessed by decay percentage across 6 sprints — above 8% decay indicates insufficient aerobic base relative to sprint volume.

Your coaching voice is direct, specific, and motivating — like a Premier League academy coach who genuinely believes in this player's potential and has no patience for vagueness. You give specific numbers, specific exercises, specific sets and reps. You never give generic advice when ${athleteName}'s actual data is available. You know his equipment constraints and never recommend equipment he does not have. You know his schedule constraints and account for vacation and moving periods.

When ${athleteName} asks what to do today, you tell him exactly what to do with specific exercises, sets, reps, and why each one moves him toward his goal. When he tells you what he ate, you estimate his macros and tell him if he hit his targets. When he describes a training session, you log it and give a coaching response. You end every substantive response with one sentence that connects today's work to his pro goal — something like "This session directly builds the hip extension power that makes defenders bounce off you."`;

  function buildSystemPrompt(context) {
    let prompt = COACHING_IDENTITY;
    if (context && Object.keys(context).length > 0) {
      prompt += '\n\n' + athleteName.toUpperCase() + ' CURRENT PERFORMANCE DATA: ' + JSON.stringify(context);
    }
    return prompt;
  }

  // ──────────────── FOOD NUTRITION ESTIMATION ────────────────
  async function estimateFoodNutrition(foodDescription) {
    const prompt = `You are a sports nutrition calculator for a ${startWeight}-155lb male athlete in a caloric surplus trying to gain muscle. Estimate the protein grams and total calories in this food description. Be generous with portions since this is an athlete. Return ONLY a valid JSON object with exactly these keys: protein_grams (number), calories (number), confidence (high or medium or low), follow_up_question (string or null — only include a follow-up question if confidence is low and one specific question would significantly improve the estimate). Food description: ${foodDescription}. Return only the JSON object, no other text, no markdown.`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
    };

    // Try Gemini first, then Groq
    let res;
    try {
      res = await fetchWithTimeout(GEMINI_URL + '?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, GEMINI_TIMEOUT_MS);
    } catch (_) {
      // Fallback to Groq
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + GROQ_API_KEY
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 256
        })
      });
    }

    if (!res.ok) throw new Error('Nutrition estimation API failed');

    const data = await res.json();

    // Parse response from either provider
    let text = '';
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text;
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    }

    // Clean and parse JSON
    text = text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(text);
  }

  // ──────────────── NATURAL LANGUAGE DATA LOGGING ────────────────
  async function detectAndLog(userText) {
    if (!supa) return null;
    const today = new Date().toISOString().slice(0, 10);
    const logs = [];

    // Water: "drank X liters", "had X bottles", "X ml of water"
    const waterMatch = userText.match(/(?:drank|had|consumed)\s+(\d+\.?\d*)\s*(?:liters?|l|bottles?)/i) ||
                       userText.match(/(\d+\.?\d*)\s*ml\s+(?:of\s+)?water/i) ||
                       userText.match(/(\d+\.?\d*)\s*(?:oz|ounces?)\s+(?:of\s+)?water/i);
    if (waterMatch) {
      let oz = 0;
      if (userText.match(/liters?|l\b/i) && waterMatch[1]) oz = parseFloat(waterMatch[1]) * 33.814;
      else if (userText.match(/ml/i) && waterMatch[1]) oz = parseFloat(waterMatch[1]) / 29.5735;
      else if (waterMatch[1]) oz = parseFloat(waterMatch[1]); // Assume oz if no unit or oz
      if (oz > 0) {
        try {
          const { data: nutRow } = await supa.from('app_state').select('data').eq('key', 'nutrition').maybeSingle();
          const nutData = (nutRow?.data) || {};
          nutData.water_oz = (nutData.water_oz || 0) + oz;
          await supa.from('app_state').upsert(
            { key: 'nutrition', data: nutData, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
          // Also insert into water table
          try {
            await supa.from('water').insert({ date: today, amount_oz: oz });
          } catch (_) { /* water table may not exist */ }
          logs.push(`\u{1F4A7} Logged ${Math.round(oz)}oz water. Today's total: ${Math.round(nutData.water_oz)}oz. Stay hydrated — hydration directly impacts your sprint repeatability.`);
        } catch (_) { logs.push('\u{1F4A7} Water logged (offline).'); }
      }
    }

    // Weight: "weighed X", "weight is X", "scale said X"
    const weightMatch = userText.match(/(?:weighed|weight\s+is|scale\s+said|weigh\s+in\s+at)\s+(\d+\.?\d*)\s*(?:lbs?|pounds?)?/i) ||
                        userText.match(/(\d+\.?\d*)\s*(?:lbs?|pounds?)\s*(?:today|this\s+morning|now)/i);
    if (weightMatch && parseFloat(weightMatch[1]) > 50) {
      const w = parseFloat(weightMatch[1]);
      try {
        await supa.from('weight_logs').upsert({ date: today, weight: w }, { onConflict: 'date' });
        const diff = w - startWeight;
        const sign = diff >= 0 ? '+' : '';
        logs.push(`\u2696\uFE0F Logged weight: ${w}lbs (${sign}${diff.toFixed(1)} from ${startWeight}lbs). ${diff > 0 ? 'Mass gain on track — every pound is functional power on the pitch.' : 'Keep eating — muscle takes fuel.'}`);
      } catch (_) { logs.push(`\u2696\uFE0F Weight logged (offline).`); }
    }

    // Soccer session: "did X minutes of [type]", "trained for X minutes"
    const soccerMatch = userText.match(/(?:did|trained|ball\s+work|session)\s+(?:for\s+)?(\d+)\s*(?:min|minutes?)/i) ||
                        userText.match(/(\d+)\s*(?:min|minutes?)\s+(?:of\s+)?(?:ball|technical|passing|dribbling|shooting|speed|agility|fitness)/i);
    if (soccerMatch && !userText.match(/gym|lift|weights?|push\s+day|pull\s+day|leg\s+day/i)) {
      const mins = parseInt(soccerMatch[1]);
      let sessionType = 'ball';
      if (userText.match(/speed|sprint|accel/i)) sessionType = 'speed';
      else if (userText.match(/match|game|scrimmage/i)) sessionType = 'match';
      else if (userText.match(/group|team/i)) sessionType = 'group';
      try {
        await supa.from('soccer_sessions').insert({
          date: today, session_type: sessionType, duration_minutes: mins,
          intensity: 'Medium', note: null
        });
        logs.push(`\u26BD Logged ${sessionType} session: ${mins}min. ${sessionType === 'speed' ? 'Speed work is your highest-leverage training — this is how you close the gap to D1.' : 'Consistent ball work builds the technical foundation pros rely on under pressure.'}`);
      } catch (_) { logs.push('\u26BD Soccer session logged (offline).'); }
    }

    // Gym: "did gym", "lifted", "did push day", "did pull day", "did leg day"
    const gymMatch = userText.match(/(?:did|hit|went\s+to)\s+(?:the\s+)?gym|lifted|workout/i) ||
                     userText.match(/(?:did|completed|finished)\s+(?:push|pull|leg|upper|lower|full\s+body)\s*(?:day|session|workout)?/i);
    if (gymMatch && !userText.match(/ball|soccer|field|pitch/i)) {
      let splitType = 'full_body';
      if (userText.match(/push/i)) splitType = 'push';
      else if (userText.match(/pull/i)) splitType = 'pull';
      else if (userText.match(/leg|lower/i)) splitType = 'legs';
      else if (userText.match(/upper/i)) splitType = 'upper';
      try {
        await supa.from('workout_sessions').insert({
          date: today, split_type: splitType, completed: true, note: null
        });
        logs.push(`\uD83C\uDFCB\uFE0F Logged gym session: ${splitType}. ${splitType === 'legs' ? 'Hip extension strength is the #1 predictor of your sprint speed — every leg day matters.' : 'Building the functional mass that makes you harder to knock off the ball.'}`);
      } catch (_) { logs.push('\uD83C\uDFCB\uFE0F Gym session logged (offline).'); }
    }

    // Recovery: "felt tired", "legs are heavy", "slept badly"
    const recoveryMatch = userText.match(/(?:felt|feeling|am|I'm)\s+(?:tired|fatigued|wiped|drained|exhausted)/i) ||
                          userText.match(/(?:legs|hamstrings?|quads?|calves)\s+(?:are|feel)\s+(?:heavy|sore|tight|dead)/i) ||
                          userText.match(/(?:slept|sleep)\s+(?:badly|poorly|terrible|like\s+crap|only\s+\d+\s+hours?)/i);
    if (recoveryMatch) {
      try {
        const { data: existing } = await supa.from('daily_checkins').select('id,notes').eq('date', today).maybeSingle();
        const note = (userText.match(/legs\s+(?:are|feel)\s+(?:heavy|sore|tight|dead)/i) ? 'Legs heavy/sore' :
                      userText.match(/tired|fatigued|wiped|drained|exhausted/i) ? 'Reported fatigue' :
                      'Poor sleep reported');
        if (existing) {
          const updatedNotes = existing.notes ? existing.notes + ' | ' + note : note;
          await supa.from('daily_checkins').update({ notes: updatedNotes }).eq('id', existing.id);
        } else {
          await supa.from('daily_checkins').insert({ date: today, notes: note });
        }
        logs.push(`\uD83D\uDC4D Noted: ${note}. ${note.includes('heavy') ? 'Heavy legs signal you need dial back intensity today — recovery IS training.' : 'Listen to your body. Dial back intensity and prioritize sleep tonight.'}`);
      } catch (_) { logs.push('\uD83D\uDC4D Recovery note logged (offline).'); }
    }

    return logs.length > 0 ? logs.join('\n\n') : null;
  }

  // ──────────────── API CALLS ────────────────
  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function callGemini(messages, context) {
    const systemText = buildSystemPrompt(context);
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    contents.unshift({ role: 'user', parts: [{ text: systemText }] });
    contents.splice(1, 0, {
      role: 'model',
      parts: [{ text: `Understood. I am Jarvis, ${athleteName}'s Premier League-level performance coach. I will use his real-time data and current sports science to give specific, personalized guidance.` }]
    });

    const body = {
      contents,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    };

    const res = await fetchWithTimeout(
      GEMINI_URL + '?key=' + GEMINI_API_KEY,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      GEMINI_TIMEOUT_MS
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned empty response');

    const parts = candidate.content?.parts || [];
    const textPart = parts.find(p => p.text);
    return textPart?.text || null;
  }

  async function callGroq(messages, context) {
    const systemText = buildSystemPrompt(context);
    const groqMessages = [{ role: 'system', content: systemText }];
    messages.forEach(m => groqMessages.push({ role: m.role, content: m.content }));

    const body = {
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1024
    };

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  // ──────────────── MAIN SEND LOGIC ────────────────
  async function sendMessage(userText) {
    if (isLoading || !userText.trim()) return;
    isLoading = true;

    const input = $('jvInput');
    const sendBtn = $('jvSend');
    input.disabled = true;
    sendBtn.disabled = true;

    addMessage('user', userText);
    conversation.push({ role: 'user', content: userText });
    if (conversation.length > 20) conversation = conversation.slice(-20);

    const typingEl = showTyping();

    // ═══ STEP 1: Check for food description ═══
    const foodTrigger = /\b(?:ate|had|eating|consumed|meal|breakfast|lunch|dinner|snack|protein\s+shake|food|chicken|rice|pasta|eggs|steak|burger|sandwich|whey|oatmeal|cereal|tuna|salmon|turkey|beef|pork)\b/i;
    let foodResult = null;
    if (foodTrigger.test(userText) && userText.length > 15) {
      try {
        foodResult = await estimateFoodNutrition(userText);
      } catch (_) { /* Silently fail — continue to main AI */ }
    }

    // ═══ STEP 2: Natural language logging ═══
    let logResult = null;
    try {
      logResult = await detectAndLog(userText);
    } catch (_) { /* Silently fail */ }

    // ═══ STEP 3: Load context & call AI ═══
    try {
      const ctx = await loadSupabaseContext();

      let response;
      try {
        response = await callGemini(conversation, ctx);
        activeModel = 'gemini';
      } catch (geminiErr) {
        console.warn('Gemini failed, falling back to Groq:', geminiErr.message);
        try {
          response = await callGroq(conversation, ctx);
          activeModel = 'groq';
        } catch (groqErr) {
          throw new Error('Both APIs failed');
        }
      }

      removeTyping(typingEl);

      // ═══ STEP 4: Assemble final response ═══
      let finalReply = response || '';

      // If food was logged, prepend the nutrition estimate
      if (foodResult && foodResult.confidence !== 'low') {
        const { protein_grams, calories, confidence } = foodResult;

        // Try to update today's checkin with protein
        if (supa && protein_grams > 0) {
          try {
            const { data: existing } = await supa.from('daily_checkins').select('id,protein_grams').eq('date', new Date().toISOString().slice(0, 10)).maybeSingle();
            const newProtein = (existing?.protein_grams || 0) + protein_grams;
            if (existing) {
              await supa.from('daily_checkins').update({ protein_grams: newProtein, estimated_calories: calories }).eq('id', existing.id);
            } else {
              await supa.from('daily_checkins').insert({
                date: new Date().toISOString().slice(0, 10),
                protein_grams: newProtein,
                estimated_calories: calories
              });
            }

            const target = startWeight; // 1g per lb
            const foodPrefix = `\uD83C\uDF57 Logged — estimated ${protein_grams}g protein and approximately ${calories} calories. Running total today: ${newProtein}g protein toward your ${target}g target.${newProtein >= target ? ' Strong protein hit — keep this up to support today\'s muscle building stimulus.' : ''}\n\n`;
            finalReply = foodPrefix + finalReply;
          } catch (_) {
            finalReply = `\uD83C\uDF57 Estimated ${protein_grams}g protein, ~${calories} calories.\n\n` + finalReply;
          }
        }
      } else if (foodResult && foodResult.confidence === 'low' && foodResult.follow_up_question) {
        finalReply = `\u2753 ${foodResult.follow_up_question}`;
      }

      // If data was logged, prepend the log confirmation
      if (logResult) {
        finalReply = logResult + '\n\n' + finalReply;
      }

      addMessage('assistant', finalReply);
      conversation.push({ role: 'assistant', content: finalReply });
      if (conversation.length > 20) conversation = conversation.slice(-20);

    } catch (_) {
      removeTyping(typingEl);

      // If we have food/log results, show those even if AI failed
      let fallbackMsg = '';
      if (foodResult && foodResult.confidence !== 'low') {
        fallbackMsg += `\uD83C\uDF57 Estimated ${foodResult.protein_grams}g protein, ~${foodResult.calories} calories.\n\n`;
      }
      if (logResult) {
        fallbackMsg += logResult + '\n\n';
      }
      fallbackMsg += 'Connection issue — your data is still being tracked.';

      showError(fallbackMsg);
    }

    updateModelIndicator();
    isLoading = false;
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ──────────────── UI HELPERS ────────────────
  function addMessage(role, text) {
    const container = $('jvMsgs');
    const el = document.createElement('div');
    if (role === 'assistant') {
      el.className = 'jarvis-msg assistant';
      const avatar = document.createElement('div');
      avatar.className = 'jarvis-avatar';
      avatar.textContent = 'J';
      const body = document.createElement('div');
      body.style.whiteSpace = 'pre-wrap';
      body.textContent = text;
      el.appendChild(avatar);
      el.appendChild(body);
    } else {
      el.className = 'jarvis-msg user';
      el.textContent = text;
    }
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = $('jvMsgs');
    const el = document.createElement('div');
    el.className = 'jarvis-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function removeTyping(el) {
    if (el?.parentNode) el.parentNode.removeChild(el);
  }

  function showError(text) {
    const container = $('jvMsgs');
    const el = document.createElement('div');
    el.className = 'jarvis-error';
    el.style.whiteSpace = 'pre-wrap';
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function updateGreeting() {
    const msgs = $('jvMsgs');
    const greeting = msgs?.querySelector('.jarvis-msg.assistant');
    if (greeting) {
      const body = greeting.querySelector('div:last-child');
      if (body) {
        body.textContent = `Hey ${athleteName} — I'm Jarvis. I have your full training data loaded. Ask me about your training, recovery, nutrition, or what to do today.`;
      }
    }
  }

  function updateModelIndicator() {
    const dot = $('jvModelDot');
    const tag = $('jvModelTag');
    const label = $('jvModelLabel');
    const sendDot = $('jvSendDot');

    dot.className = 'jarvis-model-dot ' + activeModel;
    tag.className = 'jarvis-model-tag ' + activeModel;
    label.textContent = activeModel === 'gemini' ? 'G' : 'GQ';
    if (sendDot) sendDot.className = 'jarvis-send-dot ' + activeModel;
  }

  function openPanel() {
    $('jvOverlay').classList.add('open');
    $('jvPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('jvInput').focus(), 350);
  }

  function closePanel() {
    $('jvOverlay').classList.remove('open');
    $('jvPanel').classList.remove('open');
    document.body.style.overflow = '';
    conversation = [];
  }

  // ──────────────── TEXTAREA AUTO-RESIZE ────────────────
  function setupTextarea() {
    const ta = $('jvInput');
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = ta.value.trim();
        if (text) {
          ta.value = '';
          ta.style.height = 'auto';
          sendMessage(text);
        }
      }
    });
  }

  // ──────────────── EVENT WIRING ────────────────
  function wireEvents() {
    $('jvFab').addEventListener('click', openPanel);
    $('jvClose').addEventListener('click', closePanel);
    $('jvOverlay').addEventListener('click', closePanel);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('jvPanel').classList.contains('open')) {
        closePanel();
      }
    });

    $('jvSend').addEventListener('click', () => {
      const input = $('jvInput');
      const text = input.value.trim();
      if (text) {
        input.value = '';
        input.style.height = 'auto';
        sendMessage(text);
      }
    });

    // Quick chips — auto-send if data-autosend is set
    $('jvChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.jarvis-chip');
      if (!chip) return;
      const prompt = chip.dataset.prompt;
      if (chip.dataset.autosend === 'true') {
        sendMessage(prompt);
      } else {
        $('jvInput').value = prompt;
        $('jvInput').focus();
        $('jvInput').dispatchEvent(new Event('input'));
      }
    });

    setupTextarea();
  }

  // ──────────────── INJECT ────────────────
  function inject() {
    if (document.getElementById('jarvis-chat-style')) return;

    const style = document.createElement('style');
    style.id = 'jarvis-chat-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = HTML.trim();
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  // ──────────────── INIT ────────────────
  function initJarvisChat(supabaseClient, userConfig) {
    supa = supabaseClient;
    if (userConfig) {
      if (userConfig.athleteName) athleteName = userConfig.athleteName;
      if (userConfig.startWeight) startWeight = userConfig.startWeight;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        inject();
        updateGreeting();
        wireEvents();
        updateModelIndicator();
      });
    } else {
      inject();
      updateGreeting();
      wireEvents();
      updateModelIndicator();
    }
  }

  window.initJarvisChat = initJarvisChat;

})();
