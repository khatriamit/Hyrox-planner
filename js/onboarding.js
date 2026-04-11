// ============================================================
// Onboarding Flow — Bevel-inspired multi-step setup
// ============================================================

const ONBOARDING_KEY = 'hyrox_onboarded';

// Real benchmark data from 700k+ race results (hyroxdatalab.com)
const HYROX_BENCHMARKS = {
  men_open: {
    elite:        { min: 55, max: 75,  label: 'Elite',        pct: 'Top 10%',    pace: '4:00–4:30/km', color: 'text-purple-400', bg: 'bg-purple-500/15' },
    advanced:     { min: 75, max: 85,  label: 'Advanced',     pct: 'Top 25%',    pace: '4:30–5:00/km', color: 'text-blue-400',   bg: 'bg-blue-500/15' },
    intermediate: { min: 85, max: 100, label: 'Intermediate',  pct: 'Top 50%',    pace: '5:00–5:30/km', color: 'text-green-400',  bg: 'bg-green-500/15' },
    beginner:     { min: 100, max: 114, label: 'Beginner',     pct: 'Top 75%',    pace: '5:30–6:00/km', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    first_timer:  { min: 114, max: 140, label: 'First Timer',  pct: 'Finishing!',  pace: '6:00+/km',     color: 'text-orange-400', bg: 'bg-orange-500/15' },
  },
  women_open: {
    elite:        { min: 65, max: 86,  label: 'Elite',        pct: 'Top 10%',    pace: '4:30–5:00/km', color: 'text-purple-400', bg: 'bg-purple-500/15' },
    advanced:     { min: 86, max: 98,  label: 'Advanced',     pct: 'Top 25%',    pace: '5:00–5:30/km', color: 'text-blue-400',   bg: 'bg-blue-500/15' },
    intermediate: { min: 98, max: 114, label: 'Intermediate',  pct: 'Top 50%',    pace: '5:30–6:00/km', color: 'text-green-400',  bg: 'bg-green-500/15' },
    beginner:     { min: 114, max: 130, label: 'Beginner',     pct: 'Top 75%',    pace: '6:00–6:30/km', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    first_timer:  { min: 130, max: 160, label: 'First Timer',  pct: 'Finishing!',  pace: '6:30+/km',     color: 'text-orange-400', bg: 'bg-orange-500/15' },
  },
  doubles: {
    elite:        { min: 50, max: 68,  label: 'Elite',        pct: 'Top 10%',    pace: '3:45–4:15/km', color: 'text-purple-400', bg: 'bg-purple-500/15' },
    advanced:     { min: 68, max: 80,  label: 'Advanced',     pct: 'Top 25%',    pace: '4:15–4:45/km', color: 'text-blue-400',   bg: 'bg-blue-500/15' },
    intermediate: { min: 80, max: 95,  label: 'Intermediate',  pct: 'Top 50%',    pace: '4:45–5:15/km', color: 'text-green-400',  bg: 'bg-green-500/15' },
    beginner:     { min: 95, max: 110, label: 'Beginner',     pct: 'Top 75%',    pace: '5:15–5:45/km', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    first_timer:  { min: 110, max: 135, label: 'First Timer',  pct: 'Finishing!',  pace: '5:45+/km',     color: 'text-orange-400', bg: 'bg-orange-500/15' },
  },
};

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    type: 'splash',
    title: 'Welcome to Hyrox Planner',
    subtitle: 'Your personal AI race coach for Hyrox fitness races',
    visual: '🏋️',
    cta: 'Get Started',
  },
  {
    id: 'whats_hyrox',
    type: 'info',
    title: 'What is Hyrox?',
    subtitle: 'The world\'s largest fitness race',
  },
  {
    id: 'goal',
    type: 'choice',
    title: 'What\'s your goal?',
    subtitle: 'We\'ll tailor your plan to match your ambition.',
    options: [
      { value: 'first_race', label: 'Complete my first Hyrox', icon: '🎯', desc: 'Build confidence and finish strong' },
      { value: 'improve_pb', label: 'Beat my personal best', icon: '⚡', desc: 'Optimize splits and find time savings' },
      { value: 'compete', label: 'Compete at a high level', icon: '🏆', desc: 'Elite training and race strategy' },
    ],
  },
  {
    id: 'experience',
    type: 'choice',
    title: 'Your Hyrox experience?',
    subtitle: 'This helps us calibrate your benchmarks.',
    options: [
      { value: 'beginner', label: 'Never done Hyrox', icon: '🌱', desc: '0 races completed' },
      { value: 'intermediate', label: 'Done 1-3 races', icon: '💪', desc: 'Know the format, want to improve' },
      { value: 'advanced', label: '4+ races', icon: '🔥', desc: 'Experienced competitor' },
    ],
  },
  {
    id: 'category',
    type: 'choice',
    title: 'Race category?',
    subtitle: 'Weights and benchmarks differ by division.',
    options: [
      { value: 'men_open', label: 'Men\'s Open', icon: '♂️', desc: 'Standard men\'s weights' },
      { value: 'women_open', label: 'Women\'s Open', icon: '♀️', desc: 'Standard women\'s weights' },
      { value: 'doubles', label: 'Doubles', icon: '👥', desc: 'Partner division' },
    ],
  },
  {
    id: 'age_group',
    type: 'choice',
    title: 'Age group?',
    subtitle: 'Hyrox times vary by ~2-3 min per decade. We\'ll adjust your targets.',
    options: [
      { value: '16-24', label: '16–24', icon: '🧑', desc: 'Young & explosive' },
      { value: '25-34', label: '25–34', icon: '💪', desc: 'Peak performance years' },
      { value: '35-44', label: '35–44', icon: '🔥', desc: 'Experience meets fitness' },
      { value: '45-54', label: '45–54', icon: '🏅', desc: 'Masters category' },
      { value: '55+', label: '55+', icon: '🏆', desc: 'Legends division' },
    ],
  },
  {
    id: 'fitness',
    type: 'choice',
    title: 'Current fitness level?',
    subtitle: 'Be honest — we\'ll set realistic starting targets.',
    options: [
      { value: 'low', label: 'Getting started', icon: '🚶', desc: 'New to structured training' },
      { value: 'moderate', label: 'Regularly active', icon: '🏃', desc: '3-4x per week training' },
      { value: 'high', label: 'Very fit', icon: '⚡', desc: '5+ sessions, strong cardio base' },
    ],
  },
  {
    id: 'race_date',
    type: 'race_date',
    title: 'When is your race?',
    subtitle: 'We\'ll build a training plan counting down to race day.',
  },
  {
    id: 'target_time',
    type: 'ai_target',
  },
  {
    id: 'wearable',
    type: 'wearable',
    title: 'Connect a wearable?',
    subtitle: 'Import training data and track your preparation.',
    devices: [
      { id: 'apple_health', name: 'Apple Health', color: 'pink' },
      { id: 'garmin', name: 'Garmin', color: 'blue' },
      { id: 'whoop', name: 'WHOOP', color: 'red' },
      { id: 'oura', name: 'Oura Ring', color: 'purple' },
      { id: 'luna', name: 'Luna Ring', color: 'teal' },
    ],
  },
  {
    id: 'ready',
    type: 'ready',
    title: 'You\'re all set!',
    subtitle: 'Here\'s what we\'ve built for you:',
  },
];

let onboardingStep = 0;
let onboardingData = {
  goal: '',
  experience: '',
  category: 'men_open',
  age_group: '25-34',
  fitness: '',
  targetMinutes: 97,
  targetLevel: 'intermediate',
  wearable: null,
};

function isOnboarded() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

function markOnboarded() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

function startOnboarding() {
  onboardingStep = 0;
  onboardingData = { goal: '', experience: '', category: 'men_open', age_group: '25-34', fitness: '', targetMinutes: 97, targetLevel: 'intermediate', raceDate: '', wearable: null };
  document.getElementById('onboarding-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  renderOnboardingStep();
}

// ============================================================
// AI Coach — computes recommended level based on user profile
// ============================================================
function getAIRecommendation() {
  const cat = onboardingData.category || 'men_open';
  const exp = onboardingData.experience;
  const fit = onboardingData.fitness;
  const goal = onboardingData.goal;
  const age = onboardingData.age_group || '25-34';
  const benchmarks = HYROX_BENCHMARKS[cat];

  // Score: experience (0-2) + fitness (0-2) + goal ambition (0-1)
  const expScore = { beginner: 0, intermediate: 1, advanced: 2 }[exp] || 0;
  const fitScore = { low: 0, moderate: 1, high: 2 }[fit] || 0;
  const goalBoost = goal === 'compete' ? 1 : 0;
  const total = expScore + fitScore + goalBoost;

  // Map total score to level
  let level;
  if (total >= 5) level = 'elite';
  else if (total >= 4) level = 'advanced';
  else if (total >= 2) level = 'intermediate';
  else if (total >= 1) level = 'beginner';
  else level = 'first_timer';

  const rec = benchmarks[level];
  let targetMins = Math.round((rec.min + rec.max) / 2);

  // Age adjustment: +2-3 min per decade after 25-34 baseline
  const ageAdjust = { '16-24': -2, '25-34': 0, '35-44': 3, '45-54': 6, '55+': 10 }[age] || 0;
  targetMins += ageAdjust;

  // Generate AI coach message
  const ageNote = ageAdjust > 0 ? ` (adjusted +${ageAdjust} min for ${age} age group)` : ageAdjust < 0 ? ` (adjusted ${ageAdjust} min for ${age} age group)` : '';
  const catLabel = { men_open: "Men's Open", women_open: "Women's Open", doubles: "Doubles" }[cat];

  let coachMsg = '';
  if (level === 'first_timer') {
    coachMsg = `As a first-timer in ${catLabel}, focus on finishing — not the clock. Complete all 8 stations and learn the format. A ${fmtOnboardMins(targetMins)} finish is a great target${ageNote}.`;
  } else if (level === 'beginner') {
    coachMsg = `For ${catLabel} ${age} age group, you're at a solid beginner level. Pace your runs at ${rec.pace} and build station endurance. A ${fmtOnboardMins(targetMins)} target is realistic${ageNote}.`;
  } else if (level === 'intermediate') {
    coachMsg = `Good base for ${catLabel}! Focus on your weakest stations and hold ${rec.pace} run pace. Targeting ${fmtOnboardMins(targetMins)} puts you in the top 50% of finishers in your age group (${age})${ageNote}.`;
  } else if (level === 'advanced') {
    coachMsg = `Strong ${catLabel} profile for age ${age}! Aiming for top 25%. Focus on efficient transitions, ${rec.pace} pace, and shaving station times. Target: ${fmtOnboardMins(targetMins)}${ageNote}.`;
  } else {
    coachMsg = `Elite ${catLabel} goal for age ${age}! Top 10% territory. Optimize everything — transitions, ${rec.pace} pace, station-specific power. Target: ${fmtOnboardMins(targetMins)}${ageNote}.`;
  }

  return { level, rec, targetMins, coachMsg, benchmarks };
}

function fmtOnboardMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// ============================================================
// Render Steps
// ============================================================
function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStep];
  const container = document.getElementById('onboarding-content');
  const progress = ((onboardingStep) / (ONBOARDING_STEPS.length - 1)) * 100;

  // Calculate visible steps (not skipped)
  const visibleSteps = ONBOARDING_STEPS.filter((_, i) => !shouldSkipStep(i));
  const currentVisibleIdx = visibleSteps.indexOf(step);
  const visibleProgress = visibleSteps.length > 1 ? (currentVisibleIdx / (visibleSteps.length - 1)) * 100 : 0;

  document.getElementById('onboarding-progress').style.width = visibleProgress + '%';
  document.getElementById('onboarding-step-count').textContent = `${currentVisibleIdx + 1} / ${visibleSteps.length}`;
  document.getElementById('onboarding-back').classList.toggle('invisible', onboardingStep === 0);

  if (step.type === 'splash') {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="text-7xl mb-6 animate-bounce">${step.visual}</div>
        <h2 class="text-3xl font-extrabold mb-3">${step.title}</h2>
        <p class="text-gray-400 text-sm mb-10 max-w-xs mx-auto">${step.subtitle}</p>
        <button onclick="nextOnboardingStep()" class="w-full py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
          ${step.cta}
        </button>
      </div>`;
  }

  // ---- What is Hyrox? ----
  else if (step.type === 'info') {
    container.innerHTML = `
      <div class="py-4">
        <h2 class="text-2xl font-extrabold mb-2">${step.title}</h2>
        <p class="text-gray-400 text-sm mb-5">${step.subtitle}</p>

        <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 mb-4">
          <p class="text-gray-300 text-sm leading-relaxed mb-4">
            Hyrox is a global fitness race combining <strong class="text-white">8 × 1km runs</strong> with
            <strong class="text-white">8 functional workout stations</strong> — in a fixed order, every race, worldwide.
          </p>
          <div class="text-xs text-hyrox-yellow font-semibold uppercase tracking-wider mb-3">The 8 Stations</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🎿</span>
              <div><div class="text-xs font-semibold">SkiErg</div><div class="text-[10px] text-gray-500">1000m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🛷</span>
              <div><div class="text-xs font-semibold">Sled Push</div><div class="text-[10px] text-gray-500">50m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🪢</span>
              <div><div class="text-xs font-semibold">Sled Pull</div><div class="text-[10px] text-gray-500">50m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🐸</span>
              <div><div class="text-xs font-semibold">Burpee Broad Jump</div><div class="text-[10px] text-gray-500">80m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🚣</span>
              <div><div class="text-xs font-semibold">Rowing</div><div class="text-[10px] text-gray-500">1000m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🧑‍🌾</span>
              <div><div class="text-xs font-semibold">Farmers Carry</div><div class="text-[10px] text-gray-500">200m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🏋️</span>
              <div><div class="text-xs font-semibold">Sandbag Lunges</div><div class="text-[10px] text-gray-500">100m</div></div>
            </div>
            <div class="bg-hyrox-dark rounded-lg p-2.5 flex items-center gap-2">
              <span class="text-base">🎯</span>
              <div><div class="text-xs font-semibold">Wall Balls</div><div class="text-[10px] text-gray-500">75-100 reps</div></div>
            </div>
          </div>
        </div>

        <div class="bg-hyrox-yellow/10 border border-hyrox-yellow/30 rounded-xl p-4 mb-5">
          <div class="flex items-start gap-3">
            <div class="text-2xl">📊</div>
            <div>
              <div class="font-bold text-sm text-hyrox-yellow">Race format</div>
              <p class="text-gray-300 text-xs mt-1 leading-relaxed">
                Run 1km → Station 1 → Run 1km → Station 2 → ... repeat 8 times.
                Total: ~13km of running + 8 workouts. Average finish: <strong class="text-white">1:40 (men)</strong> / <strong class="text-white">1:54 (women)</strong>.
              </p>
            </div>
          </div>
        </div>

        <button onclick="nextOnboardingStep()" class="w-full py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
          Got it — let's plan!
        </button>
        <button onclick="nextOnboardingStep()" class="w-full mt-2 py-2 text-gray-400 text-xs font-semibold">
          I already know Hyrox — skip
        </button>
      </div>`;
  }

  // ---- Choice screens ----
  else if (step.type === 'choice') {
    const selectedValue = onboardingData[step.id] || '';
    container.innerHTML = `
      <div class="py-4">
        <h2 class="text-2xl font-extrabold mb-2">${step.title}</h2>
        <p class="text-gray-400 text-sm mb-6">${step.subtitle}</p>
        <div class="space-y-3">
          ${step.options.map(opt => `
            <button onclick="selectOnboardingChoice('${step.id}', '${opt.value}')"
              class="w-full text-left p-4 rounded-xl border-2 transition-all ${selectedValue === opt.value
                ? 'border-hyrox-yellow bg-hyrox-yellow/10'
                : 'border-hyrox-gray bg-hyrox-gray/30 hover:border-hyrox-yellow/50'}">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-hyrox-dark rounded-xl flex items-center justify-center text-2xl flex-shrink-0">${opt.icon}</div>
                <div class="flex-1">
                  <div class="font-bold text-sm">${opt.label}</div>
                  <div class="text-gray-400 text-xs mt-0.5">${opt.desc}</div>
                </div>
                ${selectedValue === opt.value ? '<div class="w-6 h-6 bg-hyrox-yellow rounded-full flex items-center justify-center"><svg class="w-3.5 h-3.5 text-hyrox-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  // ---- Race Date ----
  else if (step.type === 'race_date') {
    // Generate next 12 months of possible race dates
    const today = new Date();
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        value: d.toISOString().split('T')[0].slice(0, 7), // YYYY-MM
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        weeksAway: Math.round((d - today) / (7 * 24 * 60 * 60 * 1000)),
      });
    }

    const selectedDate = onboardingData.raceDate;
    const selectedMonth = months.find(m => m.value === selectedDate);
    const weeksOut = selectedMonth ? selectedMonth.weeksAway : 0;

    let phaseBreakdown = '';
    if (weeksOut > 0) {
      const buildWeeks = Math.max(2, Math.round(weeksOut * 0.5));
      const peakWeeks = Math.max(1, Math.round(weeksOut * 0.3));
      const taperWeeks = Math.max(1, weeksOut - buildWeeks - peakWeeks);
      phaseBreakdown = `
        <div class="bg-hyrox-gray/50 border border-hyrox-yellow/20 rounded-xl p-4 mt-4">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-8 h-8 bg-hyrox-yellow rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-hyrox-dark font-extrabold text-[10px]">AI</span>
            </div>
            <div class="text-sm text-gray-300">
              <strong class="text-white">${weeksOut} weeks</strong> until race day. Here's your training phases:
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-blue-400"></div>
              <div class="flex-1 text-xs"><span class="text-blue-400 font-semibold">Build</span> · ${buildWeeks} weeks — base fitness & station technique</div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-hyrox-yellow"></div>
              <div class="flex-1 text-xs"><span class="text-hyrox-yellow font-semibold">Peak</span> · ${peakWeeks} weeks — race-pace intensity & simulation</div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-green-400"></div>
              <div class="flex-1 text-xs"><span class="text-green-400 font-semibold">Taper</span> · ${taperWeeks} week${taperWeeks > 1 ? 's' : ''} — reduce volume, stay sharp</div>
            </div>
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="py-4">
        <h2 class="text-2xl font-extrabold mb-2">${step.title}</h2>
        <p class="text-gray-400 text-sm mb-5">${step.subtitle}</p>
        <div class="grid grid-cols-2 gap-2">
          ${months.map(m => `
            <button onclick="selectRaceDate('${m.value}')"
              class="text-left p-3 rounded-xl border transition-all ${selectedDate === m.value
                ? 'border-hyrox-yellow bg-hyrox-yellow/10'
                : 'border-hyrox-gray bg-hyrox-gray/30 hover:border-hyrox-yellow/50'}">
              <div class="font-semibold text-sm">${m.label}</div>
              <div class="text-gray-500 text-[10px]">${m.weeksAway} weeks away</div>
            </button>
          `).join('')}
        </div>
        ${phaseBreakdown}
        <button onclick="nextOnboardingStep()" class="w-full mt-5 py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
          ${selectedDate ? 'Continue' : 'I don\'t have a date yet — skip'}
        </button>
        ${selectedDate ? `<button onclick="onboardingData.raceDate=''; renderOnboardingStep()" class="w-full mt-2 py-2 text-gray-400 text-xs font-semibold">Clear date</button>` : ''}
      </div>`;
  }

  // ---- AI-Driven Target Time ----
  else if (step.type === 'ai_target') {
    const ai = getAIRecommendation();
    const cat = onboardingData.category || 'men_open';
    const allLevels = HYROX_BENCHMARKS[cat];

    // Auto-set the recommendation
    onboardingData.targetMinutes = ai.targetMins;
    onboardingData.targetLevel = ai.level;

    container.innerHTML = `
      <div class="py-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 bg-hyrox-yellow/20 rounded-lg flex items-center justify-center">
            <span class="text-sm">🤖</span>
          </div>
          <h2 class="text-2xl font-extrabold">Your Target</h2>
        </div>
        <p class="text-gray-400 text-xs mb-4">AI recommendation based on your profile</p>

        <!-- AI Coach Message -->
        <div class="bg-gradient-to-br from-hyrox-yellow/10 to-hyrox-gray/50 border border-hyrox-yellow/30 rounded-xl p-4 mb-5">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 bg-hyrox-yellow rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="text-hyrox-dark font-extrabold text-xs">AI</span>
            </div>
            <div>
              <div class="text-xs font-semibold text-hyrox-yellow mb-1">Coach says:</div>
              <p class="text-gray-200 text-sm leading-relaxed">${ai.coachMsg}</p>
            </div>
          </div>
        </div>

        <!-- Recommended target (highlighted) -->
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Recommended for you</div>
        <button onclick="selectAITarget('${ai.level}', ${ai.targetMins})"
          class="w-full text-left p-4 rounded-xl border-2 border-hyrox-yellow bg-hyrox-yellow/10 mb-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-xl text-hyrox-yellow">${fmtOnboardMins(ai.targetMins)}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full ${ai.rec.bg} ${ai.rec.color} font-semibold">${ai.rec.label}</span>
                <span class="text-[10px] text-gray-400">${ai.rec.pct}</span>
              </div>
              <div class="text-gray-400 text-xs mt-1">Run pace: ${ai.rec.pace}</div>
            </div>
            <div class="w-6 h-6 bg-hyrox-yellow rounded-full flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-hyrox-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </button>

        <!-- All levels -->
        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Or choose a different level</div>
        <div class="space-y-2">
          ${Object.entries(allLevels).map(([key, lv]) => {
            if (key === ai.level) return '';
            const mid = Math.round((lv.min + lv.max) / 2);
            const isSelected = onboardingData.targetLevel === key;
            return `
            <button onclick="selectAITarget('${key}', ${mid})"
              class="w-full text-left p-3 rounded-xl border transition-all ${isSelected
                ? 'border-hyrox-yellow bg-hyrox-yellow/10'
                : 'border-hyrox-gray bg-hyrox-gray/30 hover:border-hyrox-yellow/50'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="font-bold text-sm w-12">${fmtOnboardMins(mid)}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full ${lv.bg} ${lv.color} font-semibold">${lv.label}</span>
                  <span class="text-[10px] text-gray-500">${lv.pct}</span>
                </div>
                <span class="text-gray-500 text-[10px]">${lv.pace}</span>
              </div>
            </button>`;
          }).join('')}
        </div>

        <button onclick="nextOnboardingStep()" class="w-full mt-5 py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
          Set Target & Continue
        </button>
      </div>`;
  }

  // ---- Wearable selection ----
  else if (step.type === 'wearable') {
    container.innerHTML = `
      <div class="py-4">
        <h2 class="text-2xl font-extrabold mb-2">${step.title}</h2>
        <p class="text-gray-400 text-sm mb-6">${step.subtitle}</p>
        <div class="space-y-3">
          ${step.devices.map(d => {
            const colors = { pink: 'border-pink-500 bg-pink-500/10', blue: 'border-blue-500 bg-blue-500/10', red: 'border-red-500 bg-red-500/10', purple: 'border-purple-500 bg-purple-500/10', teal: 'border-teal-500 bg-teal-500/10' };
            const selColor = colors[d.color] || 'border-hyrox-yellow bg-hyrox-yellow/10';
            const isSelected = onboardingData.wearable === d.id;
            const svgIcon = (typeof WEARABLE_ICONS !== 'undefined' && WEARABLE_ICONS[d.id]) ? WEARABLE_ICONS[d.id] : '';
            return `
            <button onclick="selectWearable('${d.id}')"
              class="w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected ? selColor : 'border-hyrox-gray bg-hyrox-gray/30 hover:border-hyrox-yellow/50'}">
              <div class="w-12 h-12 bg-hyrox-dark rounded-xl flex items-center justify-center">${svgIcon}</div>
              <div class="flex-1">
                <div class="font-bold text-sm">${d.name}</div>
                <div class="text-gray-400 text-xs">${isSelected ? 'Selected — will connect after setup' : 'Tap to select'}</div>
              </div>
              ${isSelected ? '<div class="w-6 h-6 bg-hyrox-yellow rounded-full flex items-center justify-center"><svg class="w-3.5 h-3.5 text-hyrox-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' : ''}
            </button>`;
          }).join('')}
        </div>
        <button onclick="nextOnboardingStep()" class="w-full mt-6 py-3 bg-hyrox-gray border border-hyrox-gray text-gray-300 font-semibold text-xs rounded-xl hover:border-hyrox-yellow transition-colors">
          Skip for now
        </button>
      </div>`;
  }

  // ---- Ready / Summary ----
  else if (step.type === 'ready') {
    const goalLabels = { first_race: 'Complete first Hyrox', improve_pb: 'Beat your PB', compete: 'Compete at elite level' };
    const catLabels = { men_open: "Men's Open", women_open: "Women's Open", doubles: "Doubles" };
    const expLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
    const wearableLabels = { apple_health: 'Apple Health', garmin: 'Garmin', whoop: 'WHOOP', oura: 'Oura Ring', luna: 'Luna Ring' };
    const ai = getAIRecommendation();

    container.innerHTML = `
      <div class="py-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🚀</div>
          <h2 class="text-2xl font-extrabold mb-2">${step.title}</h2>
          <p class="text-gray-400 text-sm">${step.subtitle}</p>
        </div>
        <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 space-y-3 mb-6">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Goal</span>
            <span class="font-semibold">${goalLabels[onboardingData.goal] || '—'}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Experience</span>
            <span class="font-semibold">${expLabels[onboardingData.experience] || '—'}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Category</span>
            <span class="font-semibold">${catLabels[onboardingData.category] || '—'}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Target time</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full ${ai.rec.bg} ${ai.rec.color} font-semibold">${ai.rec.label}</span>
              <span class="font-bold text-hyrox-yellow">${fmtOnboardMins(onboardingData.targetMinutes)}</span>
            </div>
          </div>
          ${onboardingData.raceDate ? `
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Race date</span>
            <span class="font-semibold">${new Date(onboardingData.raceDate + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>` : ''}
          ${onboardingData.wearable ? `
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Wearable</span>
            <span class="font-semibold">${wearableLabels[onboardingData.wearable] || '—'}</span>
          </div>` : ''}
        </div>

        <!-- AI Coach final message -->
        <div class="bg-gradient-to-br from-hyrox-yellow/10 to-hyrox-gray/50 border border-hyrox-yellow/30 rounded-xl p-4 mb-5">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-hyrox-yellow rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-hyrox-dark font-extrabold text-[10px]">AI</span>
            </div>
            <p class="text-gray-300 text-xs leading-relaxed">
              Your personalized plan is ready. I've set your benchmarks, training focus, and race-day strategy based on your ${ai.rec.label}-level profile. Let's get to work! 💪
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3">
            <div class="w-8 h-8 bg-hyrox-yellow/15 rounded-lg flex items-center justify-center text-hyrox-yellow text-sm">📊</div>
            <div><div class="text-sm font-semibold">Personalized benchmarks</div><div class="text-gray-500 text-[10px]">Station times calibrated to ${ai.rec.label} level</div></div>
          </div>
          <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3">
            <div class="w-8 h-8 bg-hyrox-yellow/15 rounded-lg flex items-center justify-center text-hyrox-yellow text-sm">🏋️</div>
            <div><div class="text-sm font-semibold">Custom training plan</div><div class="text-gray-500 text-[10px]">Weekly workouts focused on your weak stations</div></div>
          </div>
          <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3">
            <div class="w-8 h-8 bg-hyrox-yellow/15 rounded-lg flex items-center justify-center text-hyrox-yellow text-sm">🎯</div>
            <div><div class="text-sm font-semibold">Race day strategy</div><div class="text-gray-500 text-[10px]">Pacing at ${ai.rec.pace}, nutrition, and checklist</div></div>
          </div>
        </div>
        <button onclick="finishOnboarding()" class="w-full mt-6 py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
          Let's Go!
        </button>
      </div>`;
  }
}

function formatTargetRange(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `~${h}:${m.toString().padStart(2, '0')}`;
}

function selectOnboardingChoice(stepId, value) {
  onboardingData[stepId] = value;

  // Smart skip logic based on goal
  if (stepId === 'goal') {
    if (value === 'improve_pb') {
      // If improving PB, they've done it before → auto-set experience to intermediate, skip that step
      onboardingData.experience = 'intermediate';
    } else if (value === 'compete') {
      // Competing = advanced experience
      onboardingData.experience = 'advanced';
    }
  }

  renderOnboardingStep();
  setTimeout(() => nextOnboardingStep(), 400);
}

function selectRaceDate(dateValue) {
  onboardingData.raceDate = dateValue;
  renderOnboardingStep();
}

function selectAITarget(level, minutes) {
  onboardingData.targetLevel = level;
  onboardingData.targetMinutes = minutes;
  renderOnboardingStep();
}

function selectWearable(id) {
  onboardingData.wearable = onboardingData.wearable === id ? null : id;
  renderOnboardingStep();
  if (onboardingData.wearable) {
    setTimeout(() => nextOnboardingStep(), 400);
  }
}

function shouldSkipStep(idx) {
  const step = ONBOARDING_STEPS[idx];
  if (!step) return false;

  // Skip experience step if goal is "improve PB" or "compete" (they've done Hyrox before)
  if (step.id === 'experience' && (onboardingData.goal === 'improve_pb' || onboardingData.goal === 'compete')) {
    return true;
  }

  // Skip "What's Hyrox?" for experienced users (improve PB or compete)
  if (step.id === 'whats_hyrox' && (onboardingData.goal === 'improve_pb' || onboardingData.goal === 'compete')) {
    return true;
  }

  return false;
}

function nextOnboardingStep() {
  let next = onboardingStep + 1;
  while (next < ONBOARDING_STEPS.length && shouldSkipStep(next)) {
    next++;
  }
  if (next < ONBOARDING_STEPS.length) {
    onboardingStep = next;
    renderOnboardingStep();
  }
}

function prevOnboardingStep() {
  let prev = onboardingStep - 1;
  while (prev >= 0 && shouldSkipStep(prev)) {
    prev--;
  }
  if (prev >= 0) {
    onboardingStep = prev;
    renderOnboardingStep();
  }
}

function finishOnboarding() {
  const ai = getAIRecommendation();

  // Apply onboarding data to app state
  state.category = onboardingData.category;
  state.targetSeconds = onboardingData.targetMinutes * 60;

  // Set default station times for chosen category
  STATIONS.forEach(s => { state.stationTimes[s.id] = s.defaultTime[state.category]; });

  // Set run pace based on AI level recommendation
  const paceMap = {
    elite: 4.25, advanced: 4.75, intermediate: 5.25,
    beginner: 5.75, first_timer: 6.25,
  };
  state.runPace = paceMap[onboardingData.targetLevel] || 5.5;

  // Store race date if selected
  if (onboardingData.raceDate) {
    state.raceDate = onboardingData.raceDate;
  }

  // Store profile for reference
  state.profile = {
    goal: onboardingData.goal,
    experience: onboardingData.experience,
    fitness: onboardingData.fitness,
    age_group: onboardingData.age_group,
    level: onboardingData.targetLevel,
  };

  saveState();
  markOnboarded();

  // Hide onboarding, show app
  document.getElementById('onboarding-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  updateUserHeader();
  syncUIFromState();
  recalculate();

  // Route based on user type
  if (onboardingData.goal === 'first_race') {
    // First timers → show Stations tab (they don't have a PB to import)
    showTab('stations');
  } else {
    // Returning athletes → Import PB tab to pull their data
    showTab('import');
  }

  // If they selected a wearable, open the wearable modal
  if (onboardingData.wearable) {
    setTimeout(() => showWearableModal(onboardingData.wearable), 600);
  }
}
