// ============================================================
// Periodized Training Plan — Race countdown from now to goal
// ============================================================

// Training session templates by phase
const PHASE_SESSIONS = {
  build: {
    label: 'Build',
    color: 'blue',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15',
    borderClass: 'border-blue-500/30',
    description: 'Base fitness, technique, and endurance',
    weekTemplate: [
      { day: 'Mon', label: 'Station Technique', type: 'stations', focus: 'weak', intensity: 'moderate', duration: 45, desc: 'Learn proper form on weakest stations' },
      { day: 'Tue', label: 'Easy Run', type: 'run', intensity: 'easy', duration: 35, desc: 'Zone 2 aerobic base building' },
      { day: 'Wed', label: 'Full Body Strength', type: 'strength', intensity: 'moderate', duration: 50, desc: 'Compound lifts for Hyrox power' },
      { day: 'Thu', label: 'Rest', type: 'rest', duration: 0, desc: 'Active recovery or light walk' },
      { day: 'Fri', label: 'Station Endurance', type: 'stations', focus: 'all', intensity: 'moderate', duration: 50, desc: 'Practice all 8 stations at steady pace' },
      { day: 'Sat', label: 'Long Run', type: 'run', intensity: 'easy', duration: 50, desc: 'Build aerobic capacity with longer effort' },
      { day: 'Sun', label: 'Rest', type: 'rest', duration: 0, desc: 'Full recovery day' },
    ],
  },
  peak: {
    label: 'Peak',
    color: 'yellow',
    colorClass: 'text-hyrox-yellow',
    bgClass: 'bg-hyrox-yellow/15',
    borderClass: 'border-hyrox-yellow/30',
    description: 'Race-pace intensity, simulations, and speed work',
    weekTemplate: [
      { day: 'Mon', label: 'Race-Pace Stations', type: 'stations', focus: 'weak', intensity: 'high', duration: 50, desc: 'Target station times at race pace' },
      { day: 'Tue', label: 'Interval Run', type: 'run', intensity: 'high', duration: 40, desc: '1km repeats at race pace with recovery' },
      { day: 'Wed', label: 'Power & Grip', type: 'strength', intensity: 'high', duration: 45, desc: 'Sled, carry, wall ball specific power' },
      { day: 'Thu', label: 'Rest', type: 'rest', duration: 0, desc: 'Active recovery — mobility work' },
      { day: 'Fri', label: 'Half Simulation', type: 'sim', intensity: 'high', duration: 60, desc: '4 stations + 4 runs at race effort' },
      { day: 'Sat', label: 'Tempo Run', type: 'run', intensity: 'moderate', duration: 45, desc: 'Sustained effort at 80-85% race pace' },
      { day: 'Sun', label: 'Rest', type: 'rest', duration: 0, desc: 'Full recovery day' },
    ],
  },
  taper: {
    label: 'Taper',
    color: 'green',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/15',
    borderClass: 'border-green-500/30',
    description: 'Reduce volume, maintain intensity, stay sharp',
    weekTemplate: [
      { day: 'Mon', label: 'Station Sharpening', type: 'stations', focus: 'weak', intensity: 'moderate', duration: 30, desc: 'Quick reps on key stations — stay sharp' },
      { day: 'Tue', label: 'Easy Run', type: 'run', intensity: 'easy', duration: 25, desc: 'Light legs, maintain rhythm' },
      { day: 'Wed', label: 'Light Strength', type: 'strength', intensity: 'low', duration: 30, desc: 'Activation only — no fatigue' },
      { day: 'Thu', label: 'Rest', type: 'rest', duration: 0, desc: 'Mental prep & visualization' },
      { day: 'Fri', label: 'Race Rehearsal', type: 'sim', intensity: 'moderate', duration: 25, desc: '2-3 stations + runs at race pace' },
      { day: 'Sat', label: 'Shakeout Run', type: 'run', intensity: 'easy', duration: 20, desc: 'Very light — open up the legs' },
      { day: 'Sun', label: 'Rest', type: 'rest', duration: 0, desc: 'Rest & prepare gear' },
    ],
  },
  race_week: {
    label: 'Race Week',
    color: 'purple',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/30',
    description: 'Final prep — trust your training',
    weekTemplate: [
      { day: 'Mon', label: 'Light Movement', type: 'stations', focus: 'weak', intensity: 'low', duration: 20, desc: 'Touch your 2 weakest stations, easy effort' },
      { day: 'Tue', label: 'Easy Jog', type: 'run', intensity: 'easy', duration: 20, desc: '15-20 min very easy — stay loose' },
      { day: 'Wed', label: 'Rest', type: 'rest', duration: 0, desc: 'Hydration, nutrition, gear check' },
      { day: 'Thu', label: 'Openers', type: 'run', intensity: 'moderate', duration: 15, desc: '10 min easy + 4x 30s strides' },
      { day: 'Fri', label: 'Rest', type: 'rest', duration: 0, desc: 'Pack bag, review race plan' },
      { day: 'Sat', label: 'Pre-race Walk', type: 'rest', duration: 0, desc: 'Light walk, early sleep' },
      { day: 'Sun', label: 'RACE DAY', type: 'race', duration: 0, desc: 'Execute the plan. Trust the work.' },
    ],
  },
};

// ============================================================
// Recovery Matrix — Adaptive workout intensity based on fatigue
// ============================================================

const RECOVERY_STORAGE_KEY = 'hyrox_recovery';

// Muscle groups stressed by each workout type
const MUSCLE_STRESS = {
  stations:  { legs: 0.7, upper: 0.6, core: 0.5, cardio: 0.4 },
  run:       { legs: 0.8, upper: 0.1, core: 0.3, cardio: 0.7 },
  strength:  { legs: 0.6, upper: 0.7, core: 0.5, cardio: 0.2 },
  sim:       { legs: 0.9, upper: 0.7, core: 0.6, cardio: 0.8 },
  rest:      { legs: 0, upper: 0, core: 0, cardio: 0 },
  race:      { legs: 0, upper: 0, core: 0, cardio: 0 },
};

// Intensity multipliers
const INTENSITY_LOAD = { low: 0.4, easy: 0.5, moderate: 0.7, high: 1.0 };

// Recovery rates per day (how much fatigue clears per day of rest)
const RECOVERY_RATE = { legs: 0.30, upper: 0.35, core: 0.40, cardio: 0.35 };

// Recovery status thresholds
const RECOVERY_ZONES = [
  { id: 'fresh',    min: 0,   max: 0.25, label: 'Fresh',     color: 'text-green-400',  bg: 'bg-green-500/15', border: 'border-green-500/30', icon: '🟢', advice: 'Push hard today — you\'re fully recovered.' },
  { id: 'good',     min: 0.25, max: 0.50, label: 'Good',      color: 'text-blue-400',   bg: 'bg-blue-500/15',  border: 'border-blue-500/30',  icon: '🔵', advice: 'Good to go. Stick to the plan.' },
  { id: 'moderate', min: 0.50, max: 0.70, label: 'Moderate',  color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', icon: '🟡', advice: 'Some fatigue. Consider reducing intensity by 10-20%.' },
  { id: 'fatigued', min: 0.70, max: 0.85, label: 'Fatigued',  color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: '🟠', advice: 'High fatigue. Swap for a lighter session or active recovery.' },
  { id: 'overreached', min: 0.85, max: 1.0, label: 'Overreached', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: '🔴', advice: 'Take a rest day. Your body needs recovery to adapt.' },
];

// Alternative lighter sessions for each type
const RECOVERY_SWAPS = {
  stations: { label: 'Light Station Mobility', type: 'stations', intensity: 'low', duration: 20, desc: 'Gentle movement through stations — mobility & form only' },
  run:      { label: 'Recovery Walk/Jog', type: 'run', intensity: 'easy', duration: 20, desc: 'Very easy pace or brisk walk — flush the legs' },
  strength: { label: 'Mobility & Activation', type: 'strength', intensity: 'low', duration: 20, desc: 'Band work, foam rolling, joint mobility' },
  sim:      { label: 'Light Station Practice', type: 'stations', intensity: 'low', duration: 25, desc: 'Walk through 2-3 stations at 50% effort' },
};

function loadRecoveryLog() {
  try {
    const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedSessions: [], selfReports: [] };
  } catch (_) {
    return { completedSessions: [], selfReports: [] };
  }
}

function saveRecoveryLog(log) {
  localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(log));
}

function logCompletedSession(session) {
  const log = loadRecoveryLog();
  log.completedSessions.push({
    date: new Date().toISOString().split('T')[0],
    type: session.type,
    intensity: session.intensity || 'moderate',
    duration: session.duration || 0,
    timestamp: Date.now(),
  });
  // Keep last 30 days only
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  log.completedSessions = log.completedSessions.filter(s => s.timestamp > cutoff);
  saveRecoveryLog(log);
}

function logSelfReport(report) {
  const log = loadRecoveryLog();
  log.selfReports.push({
    date: new Date().toISOString().split('T')[0],
    ...report,
    timestamp: Date.now(),
  });
  // Keep last 14 days
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  log.selfReports = log.selfReports.filter(r => r.timestamp > cutoff);
  saveRecoveryLog(log);
}

function calculateRecoveryScore() {
  const log = loadRecoveryLog();
  const now = Date.now();
  const fatigue = { legs: 0, upper: 0, core: 0, cardio: 0 };

  // Calculate accumulated fatigue from recent sessions
  log.completedSessions.forEach(session => {
    const daysAgo = (now - session.timestamp) / (24 * 60 * 60 * 1000);
    if (daysAgo > 7) return; // Only consider last 7 days

    const stress = MUSCLE_STRESS[session.type] || MUSCLE_STRESS.rest;
    const intensityMul = INTENSITY_LOAD[session.intensity] || 0.7;
    const durationFactor = Math.min(1.5, (session.duration || 30) / 45); // normalize around 45 min
    const decay = Math.pow(0.6, daysAgo); // Exponential decay — recent sessions matter more

    Object.keys(fatigue).forEach(group => {
      fatigue[group] += stress[group] * intensityMul * durationFactor * decay;
    });
  });

  // Apply natural recovery (clamp to 0-1)
  Object.keys(fatigue).forEach(group => {
    fatigue[group] = Math.min(1.0, Math.max(0, fatigue[group]));
  });

  // Overall score = weighted average (legs matter most for Hyrox)
  const overall = (fatigue.legs * 0.35 + fatigue.cardio * 0.30 + fatigue.upper * 0.20 + fatigue.core * 0.15);

  // Factor in wearable sleep/recovery data if available
  const wearableSleep = getWearableSleepData();

  // Factor in self-report if recent (within last 24h)
  const recentReport = log.selfReports.find(r => (now - r.timestamp) < 24 * 60 * 60 * 1000);
  let adjustedOverall = overall;

  if (wearableSleep && wearableSleep.hasData) {
    // Wearable data gets highest priority — it's objective
    // sleepScore: 0-100, hrv: normalized 0-1, restingHR: normalized 0-1
    const wearableRecovery = wearableSleep.recoveryScore / 100; // 0-1 (1 = great)
    adjustedOverall = overall * 0.4 + (1 - wearableRecovery) * 0.6; // 60% weight on wearable data
  } else if (recentReport) {
    // sleepQuality: 1-5, soreness: 1-5, energy: 1-5
    const reportScore = ((6 - recentReport.soreness) + recentReport.sleepQuality + recentReport.energy) / 15; // 0-1 scale (1 = great)
    adjustedOverall = overall * 0.6 + (1 - reportScore) * 0.4; // Blend objective + subjective
  }

  adjustedOverall = Math.min(1.0, Math.max(0, adjustedOverall));

  // Determine recovery zone
  const zone = RECOVERY_ZONES.find(z => adjustedOverall >= z.min && adjustedOverall <= z.max) || RECOVERY_ZONES[0];

  return {
    overall: adjustedOverall,
    fatigue,
    zone,
    recentReport,
    sessionCount7d: log.completedSessions.filter(s => (now - s.timestamp) < 7 * 24 * 60 * 60 * 1000).length,
    hasData: log.completedSessions.length > 0,
  };
}

function getAdaptedSession(session, recovery) {
  if (session.type === 'rest' || session.type === 'race') return { session, adapted: false };

  const fatigue = recovery.fatigue;
  const stress = MUSCLE_STRESS[session.type] || {};

  // Check if the primary muscle groups for this session are fatigued
  const relevantFatigue = Object.entries(stress)
    .filter(([_, v]) => v > 0.4) // Only check significantly stressed groups
    .map(([group, _]) => fatigue[group] || 0);
  const maxRelevantFatigue = relevantFatigue.length > 0 ? Math.max(...relevantFatigue) : 0;

  // Decision matrix
  if (recovery.zone.id === 'overreached') {
    // Force rest day
    return {
      session: { ...session, label: '⚠️ Rest Day (Auto-Recovery)', type: 'rest', duration: 0, intensity: '', desc: 'Your body is overreached. Rest today to prevent injury and come back stronger.', _original: session },
      adapted: true,
      reason: 'Overreached — rest forced',
    };
  }

  if (recovery.zone.id === 'fatigued' && session.intensity === 'high') {
    // Swap high intensity for lighter alternative
    const swap = RECOVERY_SWAPS[session.type] || RECOVERY_SWAPS.run;
    return {
      session: { ...session, ...swap, _original: session, day: session.day, focus: session.focus },
      adapted: true,
      reason: `High fatigue — swapped to ${swap.label}`,
    };
  }

  if (recovery.zone.id === 'moderate' && maxRelevantFatigue > 0.6) {
    // Reduce duration by 20%
    const reducedDuration = Math.round(session.duration * 0.8);
    return {
      session: { ...session, duration: reducedDuration, desc: `${session.desc} (reduced 20% — recovery)`, _original: session },
      adapted: true,
      reason: 'Moderate fatigue — volume reduced 20%',
    };
  }

  if (recovery.zone.id === 'fresh' && session.intensity !== 'high') {
    // Opportunity to push harder
    const boostedDuration = Math.round(session.duration * 1.1);
    return {
      session: { ...session, duration: boostedDuration, desc: `${session.desc} (+10% — you're fresh!)`, _original: session },
      adapted: true,
      reason: 'Fresh — volume boosted 10%',
    };
  }

  return { session, adapted: false };
}

function renderRecoveryCard() {
  const recovery = calculateRecoveryScore();
  const zone = recovery.zone;
  const wearableSleep = getWearableSleepData();
  const sleepCardHtml = renderWearableSleepCard(wearableSleep);

  // Fatigue bars
  const groups = [
    { key: 'legs', label: 'Legs', icon: '🦵' },
    { key: 'cardio', label: 'Cardio', icon: '❤️' },
    { key: 'upper', label: 'Upper Body', icon: '💪' },
    { key: 'core', label: 'Core', icon: '🎯' },
  ];

  const fatigueBarsHtml = groups.map(g => {
    const pct = Math.round(recovery.fatigue[g.key] * 100);
    const barColor = pct > 70 ? 'bg-red-400' : pct > 40 ? 'bg-yellow-400' : 'bg-green-400';
    return `
      <div class="flex items-center gap-2">
        <span class="text-xs w-5">${g.icon}</span>
        <span class="text-[10px] text-gray-400 w-16">${g.label}</span>
        <div class="flex-1 h-1.5 bg-hyrox-dark rounded-full overflow-hidden">
          <div class="h-full ${barColor} rounded-full transition-all" style="width:${pct}%"></div>
        </div>
        <span class="text-[10px] text-gray-500 w-8 text-right">${pct}%</span>
      </div>`;
  }).join('');

  const overallPct = Math.round(recovery.overall * 100);

  return `
    <div class="${zone.bg} border ${zone.border} rounded-2xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">${zone.icon}</span>
          <div>
            <div class="font-bold text-sm ${zone.color}">Recovery: ${zone.label}</div>
            <div class="text-[10px] text-gray-400">${recovery.sessionCount7d} sessions in last 7 days · Fatigue ${overallPct}%</div>
          </div>
        </div>
        <button onclick="showRecoveryCheckin()" class="px-3 py-1.5 bg-hyrox-dark rounded-lg text-[10px] font-semibold text-gray-300 hover:text-white transition-colors border border-hyrox-gray">
          Check-in
        </button>
      </div>

      <!-- Wearable Sleep Data -->
      ${sleepCardHtml}

      <!-- Muscle Group Fatigue -->
      <div class="space-y-1.5 mb-3">
        ${fatigueBarsHtml}
      </div>

      <!-- AI Advice -->
      <div class="flex items-start gap-2 bg-hyrox-dark/50 rounded-xl p-3">
        <div class="w-6 h-6 bg-hyrox-yellow rounded-md flex items-center justify-center flex-shrink-0">
          <span class="text-hyrox-dark font-extrabold text-[8px]">AI</span>
        </div>
        <p class="text-[11px] text-gray-300 leading-relaxed">${zone.advice}${wearableSleep && wearableSleep.hasData ? ` <span class="text-gray-500">Based on ${wearableSleep.deviceLabel} (recovery: ${wearableSleep.recoveryScore}/100, sleep: ${wearableSleep.sleep.hours}h, HRV: ${wearableSleep.hrv}ms).</span>` : recovery.recentReport ? '' : ' <span class="text-hyrox-yellow">Connect a wearable or log a check-in for more accurate recommendations.</span>'}</p>
      </div>
    </div>`;
}

function showRecoveryCheckin() {
  const log = loadRecoveryLog();
  const today = new Date().toISOString().split('T')[0];
  const existing = log.selfReports.find(r => r.date === today);

  const modal = document.createElement('div');
  modal.id = 'recovery-checkin-modal';
  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-end justify-center';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="w-full max-w-lg bg-hyrox-dark border-t border-hyrox-gray rounded-t-2xl p-6 animate-slide-up">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-extrabold">Recovery Check-in</h3>
        <button onclick="document.getElementById('recovery-checkin-modal').remove()" class="w-8 h-8 bg-hyrox-gray rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-5">
        <!-- Sleep Quality -->
        <div>
          <label class="text-sm font-semibold mb-2 block">How did you sleep? 😴</label>
          <div class="flex gap-2" id="checkin-sleep">
            ${[1,2,3,4,5].map(v => `
              <button onclick="selectCheckin('sleep', ${v})" data-val="${v}"
                class="flex-1 py-3 rounded-xl border text-center text-sm font-semibold transition-all
                ${existing && existing.sleepQuality === v ? 'border-hyrox-yellow bg-hyrox-yellow/10 text-hyrox-yellow' : 'border-hyrox-gray bg-hyrox-gray/30 text-gray-400 hover:border-hyrox-yellow/50'}">
                ${['😫','😐','😊','😴','🌟'][v-1]}<br>
                <span class="text-[9px]">${['Awful','Poor','OK','Good','Great'][v-1]}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Soreness -->
        <div>
          <label class="text-sm font-semibold mb-2 block">Body soreness? 🦵</label>
          <div class="flex gap-2" id="checkin-soreness">
            ${[1,2,3,4,5].map(v => `
              <button onclick="selectCheckin('soreness', ${v})" data-val="${v}"
                class="flex-1 py-3 rounded-xl border text-center text-sm font-semibold transition-all
                ${existing && existing.soreness === v ? 'border-hyrox-yellow bg-hyrox-yellow/10 text-hyrox-yellow' : 'border-hyrox-gray bg-hyrox-gray/30 text-gray-400 hover:border-hyrox-yellow/50'}">
                ${['💚','🟢','🟡','🟠','🔴'][v-1]}<br>
                <span class="text-[9px]">${['None','Mild','Some','Sore','Very'][v-1]}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Energy -->
        <div>
          <label class="text-sm font-semibold mb-2 block">Energy level? ⚡</label>
          <div class="flex gap-2" id="checkin-energy">
            ${[1,2,3,4,5].map(v => `
              <button onclick="selectCheckin('energy', ${v})" data-val="${v}"
                class="flex-1 py-3 rounded-xl border text-center text-sm font-semibold transition-all
                ${existing && existing.energy === v ? 'border-hyrox-yellow bg-hyrox-yellow/10 text-hyrox-yellow' : 'border-hyrox-gray bg-hyrox-gray/30 text-gray-400 hover:border-hyrox-yellow/50'}">
                ${['🪫','😮‍💨','😐','💪','⚡'][v-1]}<br>
                <span class="text-[9px]">${['Empty','Low','OK','Good','Fired up'][v-1]}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <button onclick="submitRecoveryCheckin()" class="w-full mt-6 py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
        Save Check-in
      </button>
    </div>`;

  document.body.appendChild(modal);

  // Initialize temp state
  window._checkinData = existing ? { sleep: existing.sleepQuality, soreness: existing.soreness, energy: existing.energy } : { sleep: 0, soreness: 0, energy: 0 };
}

function selectCheckin(type, value) {
  window._checkinData = window._checkinData || { sleep: 0, soreness: 0, energy: 0 };
  window._checkinData[type] = value;

  // Update UI
  const containerId = type === 'sleep' ? 'checkin-sleep' : type === 'soreness' ? 'checkin-soreness' : 'checkin-energy';
  const container = document.getElementById(containerId);
  if (container) {
    container.querySelectorAll('button').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-val'));
      if (val === value) {
        btn.className = btn.className.replace(/border-hyrox-gray bg-hyrox-gray\/30 text-gray-400 hover:border-hyrox-yellow\/50/g, 'border-hyrox-yellow bg-hyrox-yellow/10 text-hyrox-yellow');
      } else {
        btn.className = btn.className.replace(/border-hyrox-yellow bg-hyrox-yellow\/10 text-hyrox-yellow/g, 'border-hyrox-gray bg-hyrox-gray/30 text-gray-400 hover:border-hyrox-yellow/50');
      }
    });
  }
}

function submitRecoveryCheckin() {
  const data = window._checkinData;
  if (!data || !data.sleep || !data.soreness || !data.energy) {
    // Highlight missing fields
    return;
  }

  logSelfReport({
    sleepQuality: data.sleep,
    soreness: data.soreness,
    energy: data.energy,
  });

  // Close modal and refresh
  const modal = document.getElementById('recovery-checkin-modal');
  if (modal) modal.remove();

  // Re-render the plan to reflect updated recovery
  if (state.raceDate && typeof renderPeriodizedPlan === 'function') {
    renderPeriodizedPlan();
  }
}

// Mark a session as done (called when exiting a workout)
function markSessionComplete(sessionType, sessionIntensity, sessionDuration) {
  logCompletedSession({ type: sessionType, intensity: sessionIntensity, duration: sessionDuration });
}

// ============================================================
// Wearable Sleep & Recovery Data Integration
// ============================================================

function getWearableSleepData() {
  // Check for connected wearable sleep data
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return null;

  const connectedDevice = user.connectedWearables ? Object.keys(user.connectedWearables).find(k => user.connectedWearables[k]) : null;
  if (!connectedDevice) return null;

  // Check for cached wearable data (from sync)
  const sleepKey = `hyrox_sleep_${connectedDevice}`;
  try {
    const raw = localStorage.getItem(sleepKey);
    if (raw) {
      const data = JSON.parse(raw);
      // Only use data from last 24 hours
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (_) {}

  // Generate realistic demo data if in demo mode
  if (user.connectedWearables && user.connectedWearables[connectedDevice]) {
    const demoData = generateDemoSleepData(connectedDevice);
    localStorage.setItem(sleepKey, JSON.stringify(demoData));
    return demoData;
  }

  return null;
}

function generateDemoSleepData(device) {
  // Generate realistic sleep/recovery data based on device type
  const baseScore = 55 + Math.floor(Math.random() * 40); // 55-94
  const sleepHours = 5.5 + Math.random() * 3; // 5.5 - 8.5 hrs
  const deepPct = 10 + Math.floor(Math.random() * 20); // 10-30%
  const remPct = 15 + Math.floor(Math.random() * 15); // 15-30%
  const restingHR = 48 + Math.floor(Math.random() * 18); // 48-65 bpm
  const hrv = 25 + Math.floor(Math.random() * 60); // 25-85 ms

  // Device-specific metrics
  const metrics = {
    garmin: {
      label: 'Garmin Body Battery',
      sleepScore: baseScore,
      bodyBattery: Math.round(baseScore * 1.05),
      stressLevel: Math.round(100 - baseScore * 0.8),
    },
    whoop: {
      label: 'WHOOP Recovery',
      sleepScore: baseScore,
      recoveryPct: baseScore,
      strainScore: +(2 + Math.random() * 16).toFixed(1),
    },
    oura: {
      label: 'Oura Readiness',
      sleepScore: baseScore,
      readinessScore: Math.round(baseScore * 0.95 + Math.random() * 10),
      temperature: +(-0.3 + Math.random() * 0.6).toFixed(1),
    },
    luna: {
      label: 'Luna Recovery',
      sleepScore: baseScore,
      readinessScore: Math.round(baseScore * 0.9 + Math.random() * 10),
    },
    apple_health: {
      label: 'Apple Health Sleep',
      sleepScore: baseScore,
    },
    noisefit: {
      label: 'NoiseFit Health',
      sleepScore: baseScore,
      spO2: 95 + Math.floor(Math.random() * 4),
    },
  };

  const deviceMetrics = metrics[device] || metrics.apple_health;

  return {
    hasData: true,
    device,
    deviceLabel: deviceMetrics.label,
    timestamp: Date.now(),
    recoveryScore: baseScore,
    sleep: {
      hours: +sleepHours.toFixed(1),
      deepPct,
      remPct,
      lightPct: 100 - deepPct - remPct,
      quality: baseScore > 80 ? 'Good' : baseScore > 60 ? 'Fair' : 'Poor',
    },
    hrv,
    restingHR,
    ...deviceMetrics,
  };
}

function renderWearableSleepCard(sleepData) {
  if (!sleepData || !sleepData.hasData) return '';

  const score = sleepData.recoveryScore;
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : score >= 40 ? 'text-orange-400' : 'text-red-400';
  const scoreBg = score >= 80 ? 'bg-green-500/15' : score >= 60 ? 'bg-yellow-500/15' : score >= 40 ? 'bg-orange-500/15' : 'bg-red-500/15';

  // Device-specific icon
  const deviceIcons = {
    garmin: '⌚', whoop: '📊', oura: '💍', luna: '🌙', apple_health: '❤️', noisefit: '⌚',
  };
  const icon = deviceIcons[sleepData.device] || '📱';

  // Sleep stages bar
  const stagesBar = `
    <div class="flex h-2 rounded-full overflow-hidden">
      <div class="bg-indigo-500" style="width:${sleepData.sleep.deepPct}%" title="Deep ${sleepData.sleep.deepPct}%"></div>
      <div class="bg-blue-400" style="width:${sleepData.sleep.remPct}%" title="REM ${sleepData.sleep.remPct}%"></div>
      <div class="bg-gray-500" style="width:${sleepData.sleep.lightPct}%" title="Light ${sleepData.sleep.lightPct}%"></div>
    </div>
    <div class="flex justify-between mt-1">
      <span class="text-[9px] text-indigo-400">Deep ${sleepData.sleep.deepPct}%</span>
      <span class="text-[9px] text-blue-400">REM ${sleepData.sleep.remPct}%</span>
      <span class="text-[9px] text-gray-500">Light ${sleepData.sleep.lightPct}%</span>
    </div>`;

  // Device-specific extra metrics
  let extraMetrics = '';
  if (sleepData.bodyBattery !== undefined) {
    extraMetrics = `<div class="text-center"><div class="text-sm font-bold">${sleepData.bodyBattery}</div><div class="text-[9px] text-gray-500">Body Battery</div></div>`;
  } else if (sleepData.recoveryPct !== undefined && sleepData.strainScore !== undefined) {
    extraMetrics = `<div class="text-center"><div class="text-sm font-bold">${sleepData.strainScore}</div><div class="text-[9px] text-gray-500">Strain</div></div>`;
  } else if (sleepData.readinessScore !== undefined) {
    extraMetrics = `<div class="text-center"><div class="text-sm font-bold">${sleepData.readinessScore}</div><div class="text-[9px] text-gray-500">Readiness</div></div>`;
  }

  return `
    <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 mb-3">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm">${icon}</span>
        <span class="text-xs font-semibold text-gray-300">${sleepData.deviceLabel || 'Wearable Data'}</span>
        <span class="text-[9px] text-gray-500 ml-auto">Last night</span>
      </div>

      <!-- Key metrics row -->
      <div class="grid grid-cols-4 gap-3 mb-3">
        <div class="text-center">
          <div class="text-sm font-bold ${scoreColor}">${score}</div>
          <div class="text-[9px] text-gray-500">Recovery</div>
        </div>
        <div class="text-center">
          <div class="text-sm font-bold">${sleepData.sleep.hours}h</div>
          <div class="text-[9px] text-gray-500">Sleep</div>
        </div>
        <div class="text-center">
          <div class="text-sm font-bold">${sleepData.hrv}<span class="text-[9px] text-gray-500">ms</span></div>
          <div class="text-[9px] text-gray-500">HRV</div>
        </div>
        ${extraMetrics || `
          <div class="text-center">
            <div class="text-sm font-bold">${sleepData.restingHR}<span class="text-[9px] text-gray-500">bpm</span></div>
            <div class="text-[9px] text-gray-500">RHR</div>
          </div>`}
      </div>

      <!-- Sleep stages -->
      ${stagesBar}
    </div>`;
}

function generatePeriodizedPlan() {
  const raceDate = state.raceDate;
  if (!raceDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse race date (YYYY-MM format — approximate to mid-month)
  const [year, month] = raceDate.split('-').map(Number);
  const raceDayDate = new Date(year, month - 1, 15); // Mid-month estimate

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.max(1, Math.round((raceDayDate - today) / msPerWeek));

  // Allocate phases
  let buildWeeks, peakWeeks, taperWeeks;
  if (totalWeeks <= 4) {
    buildWeeks = 0;
    peakWeeks = Math.max(1, totalWeeks - 2);
    taperWeeks = Math.min(2, totalWeeks - peakWeeks);
  } else if (totalWeeks <= 8) {
    buildWeeks = Math.floor(totalWeeks * 0.4);
    peakWeeks = Math.floor(totalWeeks * 0.4);
    taperWeeks = totalWeeks - buildWeeks - peakWeeks;
  } else {
    buildWeeks = Math.floor(totalWeeks * 0.5);
    peakWeeks = Math.floor(totalWeeks * 0.3);
    taperWeeks = totalWeeks - buildWeeks - peakWeeks - 1; // -1 for race week
  }

  // Build the week-by-week plan
  const weeks = [];
  let weekNum = 1;

  // Build Phase
  for (let i = 0; i < buildWeeks; i++) {
    const weekStart = new Date(today.getTime() + (weekNum - 1) * msPerWeek);
    const progressPct = (i + 1) / buildWeeks;
    const volumeMultiplier = 0.7 + (progressPct * 0.3); // 70% → 100% volume ramp

    weeks.push({
      weekNum,
      phase: 'build',
      phaseWeek: i + 1,
      phaseTotal: buildWeeks,
      startDate: weekStart,
      volumeMultiplier,
      sessions: scaleSessions(PHASE_SESSIONS.build.weekTemplate, volumeMultiplier),
    });
    weekNum++;
  }

  // Peak Phase
  for (let i = 0; i < peakWeeks; i++) {
    const weekStart = new Date(today.getTime() + (weekNum - 1) * msPerWeek);
    weeks.push({
      weekNum,
      phase: 'peak',
      phaseWeek: i + 1,
      phaseTotal: peakWeeks,
      startDate: weekStart,
      volumeMultiplier: 1.0,
      sessions: PHASE_SESSIONS.peak.weekTemplate,
    });
    weekNum++;
  }

  // Taper Phase
  for (let i = 0; i < taperWeeks; i++) {
    const weekStart = new Date(today.getTime() + (weekNum - 1) * msPerWeek);
    const taperReduction = 1.0 - ((i + 1) / taperWeeks) * 0.4; // 100% → 60%
    weeks.push({
      weekNum,
      phase: 'taper',
      phaseWeek: i + 1,
      phaseTotal: taperWeeks,
      startDate: weekStart,
      volumeMultiplier: taperReduction,
      sessions: scaleSessions(PHASE_SESSIONS.taper.weekTemplate, taperReduction),
    });
    weekNum++;
  }

  // Race Week (if we have enough weeks)
  if (totalWeeks > 4) {
    const weekStart = new Date(today.getTime() + (weekNum - 1) * msPerWeek);
    weeks.push({
      weekNum,
      phase: 'race_week',
      phaseWeek: 1,
      phaseTotal: 1,
      startDate: weekStart,
      volumeMultiplier: 0.3,
      sessions: PHASE_SESSIONS.race_week.weekTemplate,
    });
  }

  return {
    totalWeeks,
    buildWeeks,
    peakWeeks,
    taperWeeks,
    raceDate: raceDayDate,
    weeks,
    currentWeek: 1, // always start at week 1
  };
}

function scaleSessions(template, multiplier) {
  return template.map(s => ({
    ...s,
    duration: s.duration > 0 ? Math.round(s.duration * multiplier) : 0,
  }));
}

function getCurrentWeekIndex(plan) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < plan.weeks.length; i++) {
    const weekEnd = new Date(plan.weeks[i].startDate.getTime() + msPerWeek);
    if (now < weekEnd) return i;
  }
  return plan.weeks.length - 1;
}

function renderPeriodizedPlan() {
  const planEl = document.getElementById('train-plan');
  const plan = generatePeriodizedPlan();

  if (!plan) {
    // No race date — show the existing weekly plan
    planEl.innerHTML = `
      <div class="bg-gradient-to-br from-hyrox-gray to-hyrox-dark border border-hyrox-gray rounded-2xl p-6 mb-5">
        <span class="text-hyrox-yellow text-xs font-semibold uppercase tracking-wider">This Week</span>
        <h2 class="text-2xl font-extrabold mt-2">Training Plan</h2>
        <p class="text-gray-400 text-sm mt-1">Based on your station analysis. Tap any day to start the workout.</p>
        <div class="mt-3 p-3 bg-hyrox-yellow/10 border border-hyrox-yellow/30 rounded-xl">
          <p class="text-xs text-gray-300"><span class="text-hyrox-yellow font-semibold">Tip:</span> Set a race date in your profile to get a full periodized training plan with Build, Peak, and Taper phases.</p>
        </div>
      </div>
      <div class="space-y-2" id="weekly-plan"></div>`;
    renderWeeklyPlan();
    return;
  }

  const currentIdx = getCurrentWeekIndex(plan);
  const currentWeek = plan.weeks[currentIdx];
  const phaseInfo = PHASE_SESSIONS[currentWeek.phase];
  const weeksRemaining = plan.totalWeeks - currentWeek.weekNum + 1;

  // Phase progress bar data
  const phases = [
    { key: 'build', weeks: plan.buildWeeks },
    { key: 'peak', weeks: plan.peakWeeks },
    { key: 'taper', weeks: plan.taperWeeks },
    { key: 'race_week', weeks: plan.totalWeeks > 4 ? 1 : 0 },
  ].filter(p => p.weeks > 0);

  const phaseBarHtml = phases.map(p => {
    const pi = PHASE_SESSIONS[p.key];
    const widthPct = (p.weeks / plan.totalWeeks) * 100;
    const isActive = p.key === currentWeek.phase;
    return `<div class="h-2 rounded-full ${isActive ? 'ring-2 ring-white/50' : ''}"
      style="width:${widthPct}%; background: var(--phase-${p.key})"
      title="${pi.label}: ${p.weeks} weeks"></div>`;
  }).join('');

  // Phase legend
  const phaseLegendHtml = phases.map(p => {
    const pi = PHASE_SESSIONS[p.key];
    const isActive = p.key === currentWeek.phase;
    return `<div class="flex items-center gap-1.5 ${isActive ? 'opacity-100' : 'opacity-50'}">
      <div class="w-2 h-2 rounded-full" style="background: var(--phase-${p.key})"></div>
      <span class="text-[10px] ${isActive ? 'font-bold text-white' : 'text-gray-400'}">${pi.label} (${p.weeks}w)</span>
    </div>`;
  }).join('');

  // Weekly overview (collapsed)
  const weekListHtml = plan.weeks.map((w, idx) => {
    const pi = PHASE_SESSIONS[w.phase];
    const isCurrent = idx === currentIdx;
    const isPast = idx < currentIdx;
    const dateStr = w.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const trainingDays = w.sessions.filter(s => s.type !== 'rest').length;
    const totalMins = w.sessions.reduce((sum, s) => sum + s.duration, 0);

    return `
      <button onclick="showPlanWeek(${idx})"
        class="w-full text-left p-3 rounded-xl border transition-all ${
          isCurrent ? `${pi.borderClass} ${pi.bgClass}` :
          isPast ? 'border-hyrox-gray/50 bg-hyrox-gray/20 opacity-60' :
          'border-hyrox-gray bg-hyrox-gray/30 hover:border-hyrox-yellow/30'
        }">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${pi.bgClass} ${pi.colorClass}">
              W${w.weekNum}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm ${isPast ? 'text-gray-500' : ''}">${pi.label} — Week ${w.phaseWeek}/${w.phaseTotal}</span>
                ${isCurrent ? '<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-hyrox-yellow/20 text-hyrox-yellow font-bold">NOW</span>' : ''}
              </div>
              <div class="text-[10px] text-gray-500 mt-0.5">${dateStr} · ${trainingDays} sessions · ~${totalMins} min total</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </button>`;
  }).join('');

  // Race date display
  const raceDateStr = plan.raceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Recovery matrix
  const recovery = calculateRecoveryScore();
  const recoveryCardHtml = renderRecoveryCard();

  // Current week sessions (adapted by recovery)
  const currentSessionsHtml = renderWeekSessions(currentWeek, recovery);

  planEl.innerHTML = `
    <style>
      :root {
        --phase-build: #60A5FA;
        --phase-peak: #F5E600;
        --phase-taper: #34D399;
        --phase-race_week: #A78BFA;
      }
    </style>

    <!-- Header -->
    <div class="bg-gradient-to-br from-hyrox-gray to-hyrox-dark border border-hyrox-gray rounded-2xl p-5 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider ${phaseInfo.colorClass}">${phaseInfo.label} Phase · Week ${currentWeek.phaseWeek}/${currentWeek.phaseTotal}</span>
          <h2 class="text-2xl font-extrabold mt-1">Training Plan</h2>
        </div>
        <div class="text-right">
          <div class="text-2xl font-extrabold text-hyrox-yellow">${weeksRemaining}</div>
          <div class="text-[10px] text-gray-400 uppercase">weeks to go</div>
        </div>
      </div>
      <p class="text-gray-400 text-xs mb-4">${phaseInfo.description} · Race: ${raceDateStr}</p>

      <!-- Phase Progress Bar -->
      <div class="flex gap-1 mb-2">
        ${phaseBarHtml}
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        ${phaseLegendHtml}
      </div>
    </div>

    <!-- Recovery Status -->
    ${recoveryCardHtml}

    <!-- This Week (expanded) -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-extrabold uppercase tracking-wider">This Week</h3>
        <span class="text-[10px] text-gray-400">Week ${currentWeek.weekNum} of ${plan.totalWeeks}</span>
      </div>
      <div class="space-y-2">
        ${currentSessionsHtml}
      </div>
    </div>

    <!-- Full Plan Toggle -->
    <button onclick="toggleFullPlan()" id="full-plan-toggle"
      class="w-full py-3 bg-hyrox-gray/50 border border-hyrox-gray rounded-xl text-sm font-semibold text-gray-300 hover:border-hyrox-yellow/50 transition-colors mb-3 flex items-center justify-center gap-2">
      <svg id="full-plan-chevron" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
      View Full ${plan.totalWeeks}-Week Plan
    </button>

    <div id="full-plan-list" class="hidden space-y-2 mb-4">
      ${weekListHtml}
    </div>

    <!-- Week Detail View (shown when clicking a week) -->
    <div id="week-detail-view" class="hidden"></div>
  `;
}

function renderWeekSessions(week, recovery) {
  const phaseInfo = PHASE_SESSIONS[week.phase];
  const today = new Date().getDay(); // 0=Sun
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

  const typeColors = {
    stations: 'bg-red-500/15 text-red-400',
    run: 'bg-blue-500/15 text-blue-400',
    sim: 'bg-hyrox-yellow/15 text-hyrox-yellow',
    strength: 'bg-purple-500/15 text-purple-400',
    rest: 'bg-gray-500/15 text-gray-400',
    race: 'bg-hyrox-yellow/20 text-hyrox-yellow',
  };

  const typeIcons = {
    stations: '🏋️',
    run: '🏃',
    sim: '🔄',
    strength: '💪',
    rest: '😴',
    race: '🏁',
  };

  return week.sessions.map(s => {
    const isToday = dayMap[s.day] === today;
    const isRest = s.type === 'rest';
    const isRace = s.type === 'race';

    // Apply recovery adaptation for today's session
    let displaySession = s;
    let adaptedBadge = '';
    if (isToday && recovery && !isRest && !isRace) {
      const adapted = getAdaptedSession(s, recovery);
      displaySession = adapted.session;
      if (adapted.adapted) {
        const isSwappedToRest = displaySession.type === 'rest';
        adaptedBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded-full ${
          recovery.zone.id === 'fresh' ? 'bg-green-500/20 text-green-400' :
          recovery.zone.id === 'overreached' ? 'bg-red-500/20 text-red-400' :
          'bg-orange-500/20 text-orange-400'
        } font-semibold">${recovery.zone.id === 'fresh' ? '⬆ BOOSTED' : '⬇ ADAPTED'}</span>`;
      }
    }

    const ds = displaySession;
    const dsIsRest = ds.type === 'rest';

    return `
      <button onclick="${dsIsRest || isRace ? '' : `startDayWorkout('${ds.type}', '${ds.focus || ''}')`}"
        class="w-full text-left bg-hyrox-gray/50 border ${isToday ? 'border-hyrox-yellow' : isRace ? 'border-purple-500' : 'border-hyrox-gray'} rounded-xl p-4 ${dsIsRest && !isToday ? 'opacity-50' : 'hover:border-hyrox-yellow/30'} transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 text-center">
              <div class="text-xs font-bold ${isToday ? 'text-hyrox-yellow' : 'text-gray-400'}">${s.day}</div>
              ${isToday ? '<div class="text-[9px] text-hyrox-yellow">TODAY</div>' : ''}
            </div>
            <div>
              <div class="font-semibold text-sm flex items-center gap-2">
                <span>${typeIcons[ds.type] || ''}</span>
                ${ds.label}
                ${adaptedBadge}
                ${isRace ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold animate-pulse">RACE DAY</span>' : ''}
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[ds.type] || ''}">${ds.type.toUpperCase()}</span>
                ${ds.duration > 0 ? `<span class="text-[10px] text-gray-500">${ds.duration} min</span>` : ''}
                ${ds.intensity ? `<span class="text-[10px] text-gray-500">${ds.intensity}</span>` : ''}
              </div>
              <div class="text-[10px] text-gray-500 mt-1">${ds.desc}</div>
            </div>
          </div>
          ${!dsIsRest && !isRace ? '<svg class="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' : ''}
        </div>
      </button>`;
  }).join('');
}

function toggleFullPlan() {
  const list = document.getElementById('full-plan-list');
  const chevron = document.getElementById('full-plan-chevron');
  const toggle = document.getElementById('full-plan-toggle');

  if (list.classList.contains('hidden')) {
    list.classList.remove('hidden');
    chevron.style.transform = 'rotate(180deg)';
    toggle.innerHTML = `
      <svg id="full-plan-chevron" class="w-4 h-4 transition-transform" style="transform:rotate(180deg)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
      Hide Full Plan`;
  } else {
    list.classList.add('hidden');
    toggle.innerHTML = `
      <svg id="full-plan-chevron" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
      View Full Plan`;
  }
}

function showPlanWeek(weekIdx) {
  const plan = generatePeriodizedPlan();
  if (!plan) return;

  const week = plan.weeks[weekIdx];
  const phaseInfo = PHASE_SESSIONS[week.phase];
  const sessionsHtml = renderWeekSessions(week);
  const dateStr = week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const trainingDays = week.sessions.filter(s => s.type !== 'rest').length;
  const totalMins = week.sessions.reduce((sum, s) => sum + s.duration, 0);

  const detail = document.getElementById('week-detail-view');
  detail.classList.remove('hidden');
  detail.innerHTML = `
    <div class="bg-hyrox-gray/50 border ${phaseInfo.borderClass} rounded-2xl p-5 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold uppercase tracking-wider ${phaseInfo.colorClass}">${phaseInfo.label} Phase</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${phaseInfo.bgClass} ${phaseInfo.colorClass}">Week ${week.phaseWeek}/${week.phaseTotal}</span>
          </div>
          <h3 class="text-lg font-extrabold">Week ${week.weekNum} of ${plan.totalWeeks}</h3>
          <div class="text-[10px] text-gray-500 mt-0.5">Starting ${dateStr} · ${trainingDays} sessions · ~${totalMins} min</div>
        </div>
        <button onclick="closePlanWeekDetail()" class="w-8 h-8 bg-hyrox-dark rounded-lg flex items-center justify-center hover:bg-hyrox-gray transition-colors">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <p class="text-gray-400 text-xs">${phaseInfo.description}</p>
    </div>
    <div class="space-y-2 mb-4">
      ${sessionsHtml}
    </div>
    <button onclick="closePlanWeekDetail()" class="w-full py-3 bg-hyrox-gray border border-hyrox-gray rounded-xl text-sm font-semibold text-gray-300 hover:border-hyrox-yellow/50 transition-colors">
      Back to Plan Overview
    </button>`;

  // Scroll to detail
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closePlanWeekDetail() {
  const detail = document.getElementById('week-detail-view');
  detail.classList.add('hidden');
  detail.innerHTML = '';
}
