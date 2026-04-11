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

  // Current week sessions (expanded by default)
  const currentSessionsHtml = renderWeekSessions(currentWeek);

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

function renderWeekSessions(week) {
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

    return `
      <button onclick="${isRest || isRace ? '' : `startDayWorkout('${s.type}', '${s.focus || ''}')`}"
        class="w-full text-left bg-hyrox-gray/50 border ${isToday ? 'border-hyrox-yellow' : isRace ? 'border-purple-500' : 'border-hyrox-gray'} rounded-xl p-4 ${isRest ? 'opacity-50' : 'hover:border-hyrox-yellow/30'} transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 text-center">
              <div class="text-xs font-bold ${isToday ? 'text-hyrox-yellow' : 'text-gray-400'}">${s.day}</div>
              ${isToday ? '<div class="text-[9px] text-hyrox-yellow">TODAY</div>' : ''}
            </div>
            <div>
              <div class="font-semibold text-sm flex items-center gap-2">
                <span>${typeIcons[s.type] || ''}</span>
                ${s.label}
                ${isRace ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold animate-pulse">RACE DAY</span>' : ''}
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[s.type] || ''}">${s.type.toUpperCase()}</span>
                ${s.duration > 0 ? `<span class="text-[10px] text-gray-500">${s.duration} min</span>` : ''}
                ${s.intensity ? `<span class="text-[10px] text-gray-500">${s.intensity}</span>` : ''}
              </div>
              <div class="text-[10px] text-gray-500 mt-1">${s.desc}</div>
            </div>
          </div>
          ${!isRest && !isRace ? '<svg class="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' : ''}
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
