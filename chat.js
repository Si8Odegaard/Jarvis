// ═══════════════════════════════════════════════════════════════
//  JARVIS CHAT — AI Performance Coach
//  Import into any HTML page with: <script src="chat.js" defer></script>
//  Then call: initJarvisChat(yourSupabaseClient)
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ──────────────── CONFIGURATION ────────────────
  // Replace with your actual keys, or set window.JARVIS_GEMINI_KEY
  // and window.JARVIS_GROQ_KEY before loading this script.
  const GEMINI_API_KEY = window.JARVIS_GEMINI_KEY || 'PASTE_YOUR_GEMINI_KEY';
  const GROQ_API_KEY = window.JARVIS_GROQ_KEY || 'PASTE_YOUR_GROQ_KEY';
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';

  let supa = null;           // Supabase client (set by initJarvisChat)
  let activeModel = 'gemini'; // 'gemini' | 'groq'
  let conversation = [];      // Message history (last 20)
  let isLoading = false;

  // ──────────────── CSS INJECTION ────────────────
  const CHAT_CSS = `
.jarvis-chat-btn {
  position: fixed; bottom: 28px; right: 28px; z-index: 9999;
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #6BE3A4 0%, #4ECB8C 100%);
  border: none; cursor: pointer;
  box-shadow: 0 6px 24px rgba(107, 227, 164, 0.35), 0 2px 8px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, opacity 0.15s;
  -webkit-tap-highlight-color: transparent;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.jarvis-chat-btn:active { transform: scale(0.92); }
.jarvis-chat-btn:hover { box-shadow: 0 8px 32px rgba(107, 227, 164, 0.5), 0 4px 12px rgba(0,0,0,0.5); }
.jarvis-chat-btn.loading { opacity: 0.7; }
.jarvis-chat-btn svg { width: 24px; height: 24px; }
.jarvis-chat-btn .chat-btn-ring {
  position: absolute; inset: -3px; border-radius: 50%;
  border: 2px solid rgba(107, 227, 164, 0.3);
  animation: jarvis-ring-pulse 2s ease-in-out infinite;
}
@keyframes jarvis-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.08); opacity: 0.08; }
}

/* Chat overlay */
.jarvis-chat-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
}
.jarvis-chat-overlay.open { opacity: 1; pointer-events: auto; }

/* Chat panel */
.jarvis-chat-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 10001;
  width: min(75vw, 480px); max-width: 100vw;
  background: #0e0e10;
  border-left: 1px solid rgba(255,255,255,0.07);
  display: flex; flex-direction: column;
  transform: translateX(105%);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: -8px 0 40px rgba(0,0,0,0.5);
}
.jarvis-chat-panel.open { transform: translateX(0); }

/* Panel header */
.jarvis-chat-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.jarvis-chat-header-title {
  font-size: 16px; font-weight: 700; flex: 1;
  display: flex; align-items: center; gap: 8px;
}
.jarvis-chat-model-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  transition: background 0.3s;
}
.jarvis-chat-model-dot.gemini { background: #6BE3A4; box-shadow: 0 0 6px rgba(107,227,164,0.6); }
.jarvis-chat-model-dot.groq { background: #F2C063; box-shadow: 0 0 6px rgba(242,192,99,0.6); }
.jarvis-chat-close {
  background: rgba(255,255,255,0.07); border: none; color: #B8B6B0;
  font-size: 18px; border-radius: 50%; width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s; flex-shrink: 0;
}
.jarvis-chat-close:hover { background: rgba(255,255,255,0.14); }

/* Messages area */
.jarvis-chat-messages {
  flex: 1; overflow-y: auto; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.jarvis-chat-msg {
  max-width: 85%; padding: 12px 16px; border-radius: 14px;
  font-size: 13.5px; line-height: 1.6; word-break: break-word;
  animation: jarvis-msg-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes jarvis-msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.jarvis-chat-msg.user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(107,227,164,0.18), rgba(107,227,164,0.08));
  color: #FAFAFA; border-bottom-right-radius: 4px;
}
.jarvis-chat-msg.assistant {
  align-self: flex-start;
  background: rgba(255,255,255,0.05);
  color: #D4D2CC; border-bottom-left-radius: 4px;
}

/* Typing indicator */
.jarvis-chat-typing {
  align-self: flex-start; display: flex; gap: 4px;
  padding: 14px 18px; border-radius: 14px;
  background: rgba(255,255,255,0.05);
}
.jarvis-chat-typing span {
  width: 7px; height: 7px; border-radius: 50%;
  background: #76746E; animation: jarvis-typing 1.4s ease-in-out infinite;
}
.jarvis-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.jarvis-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes jarvis-typing {
  0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

/* Error message */
.jarvis-chat-error {
  align-self: center; text-align: center; padding: 10px 16px; border-radius: 10px;
  background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2);
  color: #FF8A8A; font-size: 12.5px; max-width: 90%;
}

/* Input area */
.jarvis-chat-input-wrap {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

/* Quick prompts */
.jarvis-chat-chips {
  display: flex; gap: 6px; margin-bottom: 10px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  padding-bottom: 2px;
}
.jarvis-chat-chips::-webkit-scrollbar { display: none; }
.jarvis-chat-chip {
  flex: 0 0 auto; padding: 7px 13px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04); color: #B8B6B0;
  font-size: 11.5px; font-weight: 600; cursor: pointer;
  font-family: inherit; white-space: nowrap;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.jarvis-chat-chip:hover { background: rgba(255,255,255,0.08); color: #FAFAFA; border-color: rgba(255,255,255,0.18); }

/* Input row */
.jarvis-chat-input-row {
  display: flex; align-items: flex-end; gap: 8px;
}
.jarvis-chat-textarea {
  flex: 1; resize: none; min-height: 42px; max-height: 120px;
  padding: 10px 14px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #FAFAFA;
  font-family: inherit; font-size: 13.5px; line-height: 1.5;
  outline: none; transition: border-color 0.15s;
}
.jarvis-chat-textarea:focus { border-color: rgba(107,227,164,0.35); }
.jarvis-chat-textarea::placeholder { color: #76746E; }

.jarvis-chat-send {
  width: 42px; height: 42px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #6BE3A4, #4ECB8C); color: #04201A;
  font-size: 16px; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; position: relative;
}
.jarvis-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
.jarvis-chat-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(107,227,164,0.3); }
.jarvis-chat-model-indicator {
  position: absolute; top: -2px; right: -2px;
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid #0e0e10;
  transition: background 0.3s;
}
.jarvis-chat-model-indicator.gemini { background: #6BE3A4; }
.jarvis-chat-model-indicator.groq { background: #F2C063; }

.jarvis-chat-mic {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #76746E;
  font-size: 14px; cursor: not-allowed; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  opacity: 0.4;
}

/* Mobile: full screen */
@media (max-width: 640px) {
  .jarvis-chat-panel { width: 100vw; max-width: 100vw; }
  .jarvis-chat-btn { bottom: calc(100px + env(safe-area-inset-bottom)); right: 16px; }
}
`;

  // ──────────────── HTML INJECTION ────────────────
  const CHAT_HTML = `
<div class="jarvis-chat-btn" id="jarvisChatBtn" aria-label="Open Jarvis chat" title="Chat with Jarvis">
  <span class="chat-btn-ring"></span>
  <svg viewBox="0 0 24 24" fill="none" stroke="#04201A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
</div>

<div class="jarvis-chat-overlay" id="jarvisChatOverlay"></div>

<div class="jarvis-chat-panel" id="jarvisChatPanel" role="dialog" aria-label="Jarvis chat">
  <div class="jarvis-chat-header">
    <div class="jarvis-chat-header-title">
      Jarvis
      <span class="jarvis-chat-model-dot gemini" id="jarvisModelDot" title="Active: Gemini"></span>
    </div>
    <button class="jarvis-chat-close" id="jarvisChatClose" aria-label="Close chat">×</button>
  </div>

  <div class="jarvis-chat-messages" id="jarvisChatMessages" role="log" aria-live="polite">
    <div class="jarvis-chat-msg assistant">
      Hey Silas — I'm Jarvis. I have your full training data loaded. Ask me anything about your training, recovery, nutrition, or what to do today.
    </div>
  </div>

  <div class="jarvis-chat-input-wrap">
    <div class="jarvis-chat-chips" id="jarvisChatChips">
      <button class="jarvis-chat-chip" data-prompt="What should I do today?">What should I do today?</button>
      <button class="jarvis-chat-chip" data-prompt="How is my recovery?">How is my recovery?</button>
      <button class="jarvis-chat-chip" data-prompt="Am I on track for pre-season?">Am I on track for pre-season?</button>
      <button class="jarvis-chat-chip" data-prompt="Log my session">Log my session</button>
    </div>
    <div class="jarvis-chat-input-row">
      <textarea class="jarvis-chat-textarea" id="jarvisChatInput" rows="1" placeholder="Ask Jarvis anything…" aria-label="Chat message"></textarea>
      <button class="jarvis-chat-mic" id="jarvisChatMic" aria-label="Voice input (coming soon)" disabled title="Voice input coming soon">🎤</button>
      <button class="jarvis-chat-send" id="jarvisChatSend" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span class="jarvis-chat-model-indicator gemini" id="jarvisSendDot"></span>
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
    const ctx = {};
    const today = new Date().toISOString().slice(0, 10);
    const last7 = new Date(today + 'T00:00:00');
    last7.setDate(last7.getDate() - 6);
    const last7Str = last7.toISOString().slice(0, 10);
    const last14 = new Date(today + 'T00:00:00');
    last14.setDate(last14.getDate() - 13);
    const last14Str = last14.toISOString().slice(0, 10);

    const queries = [
      supa.from('app_state').select('key, data').in('key', [
        'nutrition', 'soccer', 'health', 'jarvis_score', 'jarvis_history'
      ]).catch(() => ({ data: [] })),
      supa.from('daily_checkins').select('*').gte('date', last7Str).order('date', { ascending: false }).limit(7).catch(() => ({ data: [] })),
      supa.from('recovery_scores').select('*').gte('date', last7Str).order('date', { ascending: false }).limit(7).catch(() => ({ data: [] })),
      supa.from('weight_logs').select('*').order('date', { ascending: false }).limit(14).catch(() => ({ data: [] })),
      supa.from('soccer_sessions').select('*').order('date', { ascending: false }).limit(10).catch(() => ({ data: [] })),
      supa.from('workout_sessions').select('*').gte('date', last7Str).order('date', { ascending: false }).limit(7).catch(() => ({ data: [] })),
      supa.from('athletic_tests').select('*').order('date', { ascending: false }).limit(5).catch(() => ({ data: [] })),
      supa.from('nutrition_profile').select('*').limit(1).maybeSingle().catch(() => ({ data: null })),
    ];

    const results = await Promise.all(queries);

    // Parse app_state
    const appRows = (results[0]?.data || []);
    ctx.app_state = {};
    appRows.forEach(r => { ctx.app_state[r.key] = r.data; });

    ctx.daily_checkins = results[1]?.data || [];
    ctx.recovery_scores = results[2]?.data || [];
    ctx.weight_logs = results[3]?.data || [];
    ctx.soccer_sessions = results[4]?.data || [];
    ctx.workout_sessions = results[5]?.data || [];
    ctx.athletic_tests = results[6]?.data || [];
    ctx.nutrition_profile = results[7]?.data || null;

    return ctx;
  }

  // ──────────────── SYSTEM PROMPT BUILDER ────────────────
  const STATIC_SYSTEM = `You are Jarvis, a world-class personal performance coach and AI assistant for Silas, an 18-year-old box-to-box and defensive midfielder working toward D1 college soccer. Silas is currently 135lbs and his primary goals are: gain functional mass to reach 150-155lbs, improve acceleration and first-step quickness (his biggest athletic weakness), maintain and improve his excellent endurance, and develop his technical quality to D1 level. He trains mostly alone with access to balls, a goal, a wall, cones, an agility ladder, a full field, and a Planet Fitness gym. He plays occasional recreational league matches. His individual off-season runs from June 1 to mid-July, then JUCO college pre-season begins. You have access to his complete real-time performance data shown below. Use this data to give specific, personalized coaching responses — never give generic advice when his actual data is available. You can log data to his Supabase database when he describes activities. You have real-time internet access for current sports science research, nutrition information, and training methods. Keep responses concise and direct — he is an athlete, not a researcher. When he asks what to do, tell him exactly what to do with specific numbers.`;

  function buildSystemPrompt(context) {
    let prompt = STATIC_SYSTEM;
    if (context) {
      prompt += '\n\nSILAS\'S CURRENT DATA:\n' + JSON.stringify(context, null, 2);
    }
    return prompt;
  }

  // ──────────────── FUNCTION DECLARATIONS ────────────────
  const FUNCTION_DECLARATIONS = [
    {
      name: 'log_water',
      description: 'Log water intake for today. Call when the user mentions drinking water, e.g. "I drank 2 liters" or "had 3 bottles of water".',
      parameters: {
        type: 'object',
        properties: {
          amount_oz: { type: 'number', description: 'Ounces of water consumed' }
        },
        required: ['amount_oz']
      }
    },
    {
      name: 'log_weight',
      description: 'Log body weight for today. Call when the user says their weight, e.g. "weighed in at 137 this morning" or "I\'m 138.5 lbs".',
      parameters: {
        type: 'object',
        properties: {
          weight_lbs: { type: 'number', description: 'Body weight in pounds' },
          note: { type: 'string', description: 'Optional note about the weigh-in' }
        },
        required: ['weight_lbs']
      }
    },
    {
      name: 'log_soccer_session',
      description: 'Log a soccer training session. Call when the user describes a training session, e.g. "did a 45 minute technical session" or "just finished speed work".',
      parameters: {
        type: 'object',
        properties: {
          session_type: { type: 'string', enum: ['ball', 'speed', 'gym', 'match', 'group'], description: 'Type of session' },
          duration_minutes: { type: 'integer', description: 'Duration in minutes' },
          intensity: { type: 'string', enum: ['Light', 'Medium', 'Hard'], description: 'Session intensity' },
          focus_areas: { type: 'array', items: { type: 'string' }, description: 'Areas focused on during the session' },
          note: { type: 'string', description: 'Any additional notes' }
        },
        required: ['session_type', 'duration_minutes']
      }
    },
    {
      name: 'log_checkin_protein',
      description: 'Update today\'s protein intake. Call when the user mentions protein consumption, e.g. "got 150g protein today" or "hit my protein target".',
      parameters: {
        type: 'object',
        properties: {
          protein_grams: { type: 'integer', description: 'Grams of protein consumed today' }
        },
        required: ['protein_grams']
      }
    },
    {
      name: 'update_app_state',
      description: 'Update a key-value pair in the app state (used for tracking various metrics).',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'The key to update' },
          value: { type: 'string', description: 'The value to set (stringified)' }
        },
        required: ['key', 'value']
      }
    }
  ];

  // ──────────────── FUNCTION EXECUTOR ────────────────
  async function executeFunction(name, args) {
    if (!supa) return { error: 'Supabase not connected' };
    const today = new Date().toISOString().slice(0, 10);

    try {
      switch (name) {
        case 'log_water': {
          const oz = args.amount_oz || (args.amount_ml ? args.amount_ml / 29.5735 : 8);
          // Read current nutrition data
          const { data: nutRow } = await supa.from('app_state').select('data').eq('key', 'nutrition').maybeSingle();
          const nutData = nutRow?.data || {};
          nutData.water_oz = (nutData.water_oz || 0) + oz;
          await supa.from('app_state').upsert({ key: 'nutrition', data: nutData, updated_at: new Date().toISOString() }, { onConflict: 'key' });
          return { success: true, message: `Logged ${Math.round(oz)}oz water. Today's total: ${Math.round(nutData.water_oz)}oz.` };
        }

        case 'log_weight': {
          await supa.from('weight_logs').upsert({ date: today, weight: args.weight_lbs }, { onConflict: 'date' });
          return { success: true, message: `Logged weight: ${args.weight_lbs}lbs.` };
        }

        case 'log_soccer_session': {
          const payload = {
            date: today,
            session_type: args.session_type,
            duration_minutes: args.duration_minutes,
            intensity: args.intensity || 'Medium',
            focus_areas: args.focus_areas || [],
            note: args.note || null
          };
          await supa.from('soccer_sessions').insert(payload);
          return { success: true, message: `Logged ${args.session_type} session: ${args.duration_minutes}min.` };
        }

        case 'log_checkin_protein': {
          const { data: existing } = await supa.from('daily_checkins').select('id').eq('date', today).maybeSingle();
          if (existing) {
            await supa.from('daily_checkins').update({ protein_grams: args.protein_grams }).eq('id', existing.id);
          } else {
            await supa.from('daily_checkins').insert({ date: today, protein_grams: args.protein_grams });
          }
          return { success: true, message: `Updated today's protein to ${args.protein_grams}g.` };
        }

        case 'update_app_state': {
          let value;
          try { value = JSON.parse(args.value); } catch (_) { value = args.value; }
          await supa.from('app_state').upsert({ key: args.key, data: value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
          return { success: true, message: `Updated app_state key "${args.key}".` };
        }

        default:
          return { error: `Unknown function: ${name}` };
      }
    } catch (e) {
      return { error: e.message || 'Failed to log data' };
    }
  }

  // ──────────────── GEMINI API CALL ────────────────
  async function callGemini(messages, context) {
    const systemText = buildSystemPrompt(context);

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add system instruction as first user message (Gemini doesn't have system role)
    contents.unshift({
      role: 'user',
      parts: [{ text: systemText }]
    });
    // Add a model response to the system prompt to set the stage
    contents.splice(1, 0, {
      role: 'model',
      parts: [{ text: 'Understood. I am Jarvis, Silas\'s performance coach. I will use his real-time data to give specific, personalized guidance.' }]
    });

    const body = {
      contents,
      tools: [
        { googleSearch: {} },
        { functionDeclarations: FUNCTION_DECLARATIONS }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    const res = await fetch(GEMINI_URL + '?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned empty response');

    const parts = candidate.content?.parts || [];
    const textPart = parts.find(p => p.text);
    const fnPart = parts.find(p => p.functionCall);

    return {
      text: textPart?.text || null,
      functionCall: fnPart?.functionCall || null
    };
  }

  // ──────────────── GROQ API CALL (FALLBACK) ────────────────
  async function callGroq(messages, context) {
    const systemText = buildSystemPrompt(context);

    const groqMessages = [
      { role: 'system', content: systemText }
    ];

    messages.forEach(m => {
      groqMessages.push({ role: m.role, content: m.content });
    });

    const body = {
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1024,
      tools: FUNCTION_DECLARATIONS.map(fn => ({
        type: 'function',
        function: fn
      }))
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
      throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('Groq returned empty response');

    const msg = choice.message;
    let text = msg.content || null;
    let functionCall = null;

    if (msg.tool_calls?.length > 0) {
      const tc = msg.tool_calls[0];
      functionCall = {
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || '{}')
      };
    }

    return { text, functionCall };
  }

  // ──────────────── MAIN SEND LOGIC ────────────────
  async function sendMessage(userText) {
    if (isLoading || !userText.trim()) return;
    isLoading = true;

    const input = $('jarvisChatInput');
    const sendBtn = $('jarvisChatSend');
    input.disabled = true;
    sendBtn.disabled = true;

    // Add user message
    addMessage('user', userText);
    conversation.push({ role: 'user', content: userText });
    // Trim to last 20
    if (conversation.length > 20) conversation = conversation.slice(-20);

    // Show typing indicator
    const typingEl = showTyping();

    try {
      // Load Supabase context in parallel with API delay
      const ctx = await loadSupabaseContext();

      // Try Gemini first
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

      // Handle function calling
      let fnResult = null;
      if (response.functionCall) {
        fnResult = await executeFunction(response.functionCall.name, response.functionCall.args);

        // Add function result to conversation and get final response
        const fnSummary = fnResult.success
          ? `Function call result: ${JSON.stringify(fnResult)}`
          : `Function call failed: ${fnResult.error}`;
        conversation.push({ role: 'user', content: fnSummary });

        // Re-call the active model for final response
        let finalResponse;
        try {
          if (activeModel === 'gemini') {
            finalResponse = await callGemini(conversation, ctx);
          } else {
            finalResponse = await callGroq(conversation, ctx);
          }
        } catch (_) {
          // If second call fails, use the function result directly
          finalResponse = { text: fnResult.message || fnResult.error || 'Done.' };
        }

        response = finalResponse;
      }

      const reply = response.text || (fnResult?.message || 'Got it.');
      addMessage('assistant', reply);
      conversation.push({ role: 'assistant', content: reply });
      if (conversation.length > 20) conversation = conversation.slice(-20);

    } catch (err) {
      removeTyping(typingEl);
      showError('Connection issue — check your internet and try again.');
    }

    updateModelIndicator();
    isLoading = false;
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ──────────────── UI HELPERS ────────────────
  function addMessage(role, text) {
    const container = $('jarvisChatMessages');
    const el = document.createElement('div');
    el.className = 'jarvis-chat-msg ' + role;
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = $('jarvisChatMessages');
    const el = document.createElement('div');
    el.className = 'jarvis-chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showError(text) {
    const container = $('jarvisChatMessages');
    const el = document.createElement('div');
    el.className = 'jarvis-chat-error';
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function updateModelIndicator() {
    const dot = $('jarvisModelDot');
    const sendDot = $('jarvisSendDot');
    dot.className = 'jarvis-chat-model-dot ' + activeModel;
    if (sendDot) sendDot.className = 'jarvis-chat-model-indicator ' + activeModel;
    dot.title = 'Active: ' + (activeModel === 'gemini' ? 'Gemini 2.0 Flash' : 'Groq (Llama 3.3)');
  }

  function openPanel() {
    $('jarvisChatOverlay').classList.add('open');
    $('jarvisChatPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus input after animation
    setTimeout(() => $('jarvisChatInput').focus(), 350);
  }

  function closePanel() {
    $('jarvisChatOverlay').classList.remove('open');
    $('jarvisChatPanel').classList.remove('open');
    document.body.style.overflow = '';
    // Reset conversation when closed (fresh start next time)
    conversation = [];
  }

  // ──────────────── AUTO-RESIZE TEXTAREA ────────────────
  function setupTextarea() {
    const ta = $('jarvisChatInput');
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
    // Toggle panel
    $('jarvisChatBtn').addEventListener('click', openPanel);
    $('jarvisChatClose').addEventListener('click', closePanel);
    $('jarvisChatOverlay').addEventListener('click', closePanel);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('jarvisChatPanel').classList.contains('open')) {
        closePanel();
      }
    });

    // Send button
    $('jarvisChatSend').addEventListener('click', () => {
      const input = $('jarvisChatInput');
      const text = input.value.trim();
      if (text) {
        input.value = '';
        input.style.height = 'auto';
        sendMessage(text);
      }
    });

    // Quick prompt chips
    $('jarvisChatChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.jarvis-chat-chip');
      if (!chip) return;
      const prompt = chip.dataset.prompt;
      $('jarvisChatInput').value = prompt;
      $('jarvisChatInput').focus();
      $('jarvisChatInput').dispatchEvent(new Event('input'));
    });

    setupTextarea();
  }

  // ──────────────── CSS/HTML INJECTION ────────────────
  function inject() {
    if (document.getElementById('jarvis-chat-style')) return;

    // CSS
    const style = document.createElement('style');
    style.id = 'jarvis-chat-style';
    style.textContent = CHAT_CSS;
    document.head.appendChild(style);

    // HTML
    const wrapper = document.createElement('div');
    wrapper.innerHTML = CHAT_HTML.trim();
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  // ──────────────── INIT ────────────────
  function initJarvisChat(supabaseClient) {
    supa = supabaseClient;
    inject();
    wireEvents();
    updateModelIndicator();
    console.log('Jarvis Chat ready — model:', GEMINI_API_KEY.includes('PASTE') ? 'NEEDS KEY' : 'Gemini 2.0 Flash');
  }

  window.initJarvisChat = initJarvisChat;

})();
