// ============================================================
// State — persisted to localStorage
// ============================================================
const STORAGE_KEY = 'hyrox_planner';

let state = loadState();

function defaultState() {
  const st = {};
  STATIONS.forEach(s => { st[s.id] = s.defaultTime.men_open; });
  return {
    targetSeconds: 5400, // 1:30:00
    category: 'men_open',
    runPace: 5.5, // min/km
    stationTimes: st
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetAll() {
  state = defaultState();
  saveState();
  syncUIFromState();
  recalculate();
}

// ============================================================
// Tab Navigation
// ============================================================
const TABS = ['import', 'setup', 'stations', 'analysis', 'train', 'raceday'];

function showTab(tab) {
  TABS.forEach(t => {
    document.getElementById(`section-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-${t}`);
    if (t === tab) { btn.classList.add('tab-active'); btn.classList.remove('text-gray-400'); }
    else { btn.classList.remove('tab-active'); btn.classList.add('text-gray-400'); }
  });
  window.scrollTo(0, 0);
  if (tab === 'analysis') renderAnalysis();
  if (tab === 'train') renderWeeklyPlan();
}

// ============================================================
// Helpers
// ============================================================
function fmt(totalSec) {
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fmtPace(minPerKm) {
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function pctOf(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

// ============================================================
// My Race Tab
// ============================================================
function onTargetChange() {
  const h = parseInt(document.getElementById('target-hours').value) || 0;
  const m = parseInt(document.getElementById('target-mins').value) || 0;
  const s = parseInt(document.getElementById('target-secs').value) || 0;
  state.targetSeconds = h * 3600 + m * 60 + s;
  saveState();
  recalculate();
}

function setTarget(totalMins, secs) {
  state.targetSeconds = totalMins * 60 + secs;
  saveState();
  syncTargetInputs();
  recalculate();
}

function syncTargetInputs() {
  const t = state.targetSeconds;
  document.getElementById('target-hours').value = Math.floor(t / 3600);
  document.getElementById('target-mins').value = Math.floor((t % 3600) / 60);
  document.getElementById('target-secs').value = t % 60;
}

function setCategory(cat) {
  state.category = cat;
  // Reset station times to defaults for new category
  STATIONS.forEach(s => { state.stationTimes[s.id] = s.defaultTime[cat]; });
  saveState();
  syncCategoryButtons();
  renderStationInputs();
  recalculate();
}

function syncCategoryButtons() {
  ['men_open', 'women_open', 'doubles'].forEach(c => {
    const btn = document.getElementById(`cat-${c}`);
    if (c === state.category) {
      btn.className = 'flex-1 py-2.5 rounded-lg text-xs font-semibold bg-hyrox-yellow text-hyrox-dark';
    } else {
      btn.className = 'flex-1 py-2.5 rounded-lg text-xs font-semibold bg-hyrox-gray text-gray-300 border border-hyrox-gray';
    }
  });
}

function onPaceChange() {
  state.runPace = parseFloat(document.getElementById('pace-slider').value);
  document.getElementById('pace-display').textContent = fmtPace(state.runPace);
  saveState();
  recalculate();
}

function syncPaceSlider() {
  document.getElementById('pace-slider').value = state.runPace;
  document.getElementById('pace-display').textContent = fmtPace(state.runPace);
}

// ============================================================
// Stations Tab
// ============================================================
function renderStationInputs() {
  const el = document.getElementById('station-inputs');
  el.innerHTML = STATIONS.map(s => {
    const currentSec = state.stationTimes[s.id];
    const bm = s.benchmarks[state.category];
    const maxSlider = Math.round(bm.slow * 1.3);
    const minSlider = Math.round(bm.good * 0.7);
    return `
    <div class="station-card bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-hyrox-dark rounded-lg flex items-center justify-center text-xl">${s.icon}</div>
          <div>
            <div class="font-semibold text-sm">${s.order}. ${s.name}</div>
            <div class="text-gray-500 text-xs">${s.distance || s.reps}${s.weight ? ' · ' + s.weight : ''}</div>
          </div>
        </div>
        <span id="time-${s.id}" class="text-hyrox-yellow font-bold text-lg">${fmt(currentSec)}</span>
      </div>
      <input type="range" min="${minSlider}" max="${maxSlider}" step="5" value="${currentSec}"
        id="slider-${s.id}" oninput="onStationSlider('${s.id}')" class="w-full" />
      <div class="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>Fast ${fmt(bm.good)}</span>
        <span>Avg ${fmt(bm.average)}</span>
        <span>Slow ${fmt(bm.slow)}</span>
      </div>
    </div>`;
  }).join('');
}

function onStationSlider(id) {
  const val = parseInt(document.getElementById(`slider-${id}`).value);
  state.stationTimes[id] = val;
  document.getElementById(`time-${id}`).textContent = fmt(val);
  saveState();
  recalculate();
}

// ============================================================
// Core Calculation
// ============================================================
function getProjected() {
  const runSec = state.runPace * 60 * 8;
  let stationSec = 0;
  STATIONS.forEach(s => { stationSec += state.stationTimes[s.id]; });
  const transitionSec = 8 * 60;
  return { runSec, stationSec, transitionSec, totalSec: runSec + stationSec + transitionSec };
}

function recalculate() {
  const p = getProjected();

  // Summary card
  document.getElementById('projected-time').textContent = fmt(p.totalSec);
  document.getElementById('summary-run').textContent = fmt(p.runSec);
  document.getElementById('summary-stations').textContent = fmt(p.stationSec);

  // Station total
  const stEl = document.getElementById('stations-total');
  if (stEl) stEl.textContent = fmt(p.stationSec);

  // Delta banner
  const delta = p.totalSec - state.targetSeconds;
  const banner = document.getElementById('delta-banner');
  banner.classList.remove('hidden');
  if (delta <= 0) {
    banner.className = 'mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold bg-green-500/15 text-green-400';
    banner.textContent = `✓ On target — ${fmt(Math.abs(delta))} under your goal`;
  } else if (delta <= 300) {
    banner.className = 'mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold bg-yellow-500/15 text-yellow-400';
    banner.textContent = `⚠ ${fmt(delta)} over target — close, focus on weak stations`;
  } else {
    banner.className = 'mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold bg-red-500/15 text-red-400';
    banner.textContent = `▲ ${fmt(delta)} over target — adjust pace or station times`;
  }
}

// ============================================================
// Analysis Tab
// ============================================================
function renderAnalysis() {
  const p = getProjected();
  const cat = state.category;
  const circumference = 2 * Math.PI * 15.5; // ~97.4

  // Donut chart
  const runPct = pctOf(p.runSec, p.totalSec);
  const staPct = pctOf(p.stationSec, p.totalSec);
  const traPct = pctOf(p.transitionSec, p.totalSec);

  const runDash = (runPct / 100) * circumference;
  const staDash = (staPct / 100) * circumference;
  const traDash = (traPct / 100) * circumference;

  const ringRun = document.getElementById('ring-run');
  const ringSta = document.getElementById('ring-station');
  const ringTra = document.getElementById('ring-transition');

  ringRun.setAttribute('stroke-dasharray', `${runDash} ${circumference}`);
  ringRun.setAttribute('stroke-dashoffset', '0');

  ringSta.setAttribute('stroke-dasharray', `${staDash} ${circumference}`);
  ringSta.setAttribute('stroke-dashoffset', `-${runDash}`);

  ringTra.setAttribute('stroke-dasharray', `${traDash} ${circumference}`);
  ringTra.setAttribute('stroke-dashoffset', `-${runDash + staDash}`);

  document.getElementById('donut-total').textContent = fmt(p.totalSec);
  document.getElementById('breakdown-run').textContent = ` ${fmt(p.runSec)} (${Math.round(runPct)}%)`;
  document.getElementById('breakdown-station').textContent = ` ${fmt(p.stationSec)} (${Math.round(staPct)}%)`;

  // Station rankings — sorted by delta from "good" benchmark (biggest gap first)
  const ranked = STATIONS.map(s => {
    const time = state.stationTimes[s.id];
    const bm = s.benchmarks[cat];
    const deltaFromGood = time - bm.good;
    const deltaFromAvg = time - bm.average;
    let level = 'good';
    if (time > bm.slow) level = 'slow';
    else if (time > bm.average) level = 'slow';
    else if (time > bm.good) level = 'average';
    return { ...s, time, deltaFromGood, deltaFromAvg, level, bm };
  }).sort((a, b) => b.deltaFromGood - a.deltaFromGood);

  const maxDelta = ranked[0].deltaFromGood || 1;

  document.getElementById('station-rankings').innerHTML = ranked.map((r, i) => {
    const barPct = Math.max(5, (r.deltaFromGood / maxDelta) * 100);
    const colorClass = r.level === 'slow' ? 'bg-red-500' : r.level === 'average' ? 'bg-yellow-500' : 'bg-green-500';
    const badge = r.level === 'slow' ? '<span class="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold ml-1">TIME LEAK</span>'
      : r.level === 'good' ? '<span class="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold ml-1">STRONG</span>' : '';
    return `
    <div>
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center">
          <span class="text-sm">${r.icon}</span>
          <span class="text-sm font-medium ml-2">${r.name}</span>
          ${badge}
        </div>
        <span class="text-sm font-bold ${r.level === 'slow' ? 'text-red-400' : r.level === 'average' ? 'text-yellow-400' : 'text-green-400'}">${fmt(r.time)}</span>
      </div>
      <div class="w-full bg-hyrox-dark rounded-full h-2 mb-1">
        <div class="bar-fill ${colorClass} h-2 rounded-full" style="width: ${barPct}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-gray-500">
        <span>+${fmt(r.deltaFromGood)} vs good (${fmt(r.bm.good)})</span>
        <span>${r.deltaFromAvg > 0 ? '+' : ''}${fmt(Math.abs(r.deltaFromAvg))} vs avg</span>
      </div>
    </div>`;
  }).join('');

  // Improvement suggestions — top 3 weakest
  const top3 = ranked.slice(0, 3);
  document.getElementById('suggestions').innerHTML = top3.map((r, i) => {
    const imp = r.improvements.find(im => im.condition === r.level) || r.improvements[0];
    const saveable = r.time - r.bm.average;
    return `
    <div class="bg-hyrox-dark rounded-xl p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${r.icon}</span>
        <span class="font-semibold text-sm">${r.name}</span>
        ${saveable > 0 ? `<span class="text-[10px] text-hyrox-yellow ml-auto">Save ~${fmt(saveable)}</span>` : ''}
      </div>
      <p class="text-gray-300 text-xs leading-relaxed">${imp.text}</p>
    </div>`;
  }).join('');

  // Full splits table
  let cumulative = 0;
  const targetPerSegment = state.targetSeconds / 16; // rough per-segment target
  document.getElementById('splits-table').innerHTML = STATIONS.map((s, i) => {
    const runSec = state.runPace * 60;
    const staSec = state.stationTimes[s.id];
    const segmentTime = runSec + staSec + 60; // +60 transition
    cumulative += segmentTime;

    const expectedCum = ((i + 1) / 8) * state.targetSeconds;
    const cDelta = cumulative - expectedCum;
    const deltaColor = cDelta <= 0 ? 'text-green-400' : cDelta <= 120 ? 'text-yellow-400' : 'text-red-400';
    const deltaSign = cDelta <= 0 ? '' : '+';

    return `
    <div class="grid grid-cols-4 px-5 py-2.5 text-sm items-center">
      <div>
        <div class="font-medium text-xs">${s.icon} ${s.name}</div>
        <div class="text-[10px] text-gray-500">Run ${i + 1} + Station</div>
      </div>
      <div class="text-center text-xs">
        <div>${fmt(runSec)} + ${fmt(staSec)}</div>
      </div>
      <div class="text-center font-medium text-xs">${fmt(Math.round(cumulative))}</div>
      <div class="text-right text-xs font-semibold ${deltaColor}">${deltaSign}${fmt(Math.abs(Math.round(cDelta)))}</div>
    </div>`;
  }).join('');
}

// ============================================================
// Race Day Tab (unchanged logic)
// ============================================================
function renderChecklist() {
  document.getElementById('checklist').innerHTML = CHECKLIST_ITEMS.map(cat => `
    <div class="mb-3 last:mb-0">
      <div class="text-xs font-semibold text-hyrox-yellow uppercase tracking-wider mb-2">${cat.category}</div>
      ${cat.items.map(item => `
        <label class="flex items-center gap-3 py-1.5 cursor-pointer group">
          <input type="checkbox" class="w-4 h-4 rounded border-gray-600 bg-hyrox-dark text-hyrox-yellow accent-yellow-400" />
          <span class="text-sm text-gray-300 group-has-[:checked]:line-through group-has-[:checked]:text-gray-500">${item}</span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

function renderStrategyTips() {
  document.getElementById('strategy-tips').innerHTML = STRATEGY_TIPS.map((tip, i) => `
    <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4">
      <div class="flex items-start gap-3">
        <div class="w-7 h-7 bg-hyrox-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="text-hyrox-yellow font-bold text-xs">${i + 1}</span>
        </div>
        <div>
          <div class="font-semibold text-sm">${tip.title}</div>
          <div class="text-gray-400 text-xs mt-1 leading-relaxed">${tip.detail}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderNutrition() {
  document.getElementById('nutrition-timeline').innerHTML = NUTRITION_TIMELINE.map(n => `
    <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 flex gap-4">
      <div class="flex-shrink-0 w-20">
        <span class="text-hyrox-yellow font-semibold text-xs">${n.time}</span>
      </div>
      <p class="text-gray-300 text-sm leading-relaxed">${n.advice}</p>
    </div>
  `).join('');
}

// ============================================================
// Import PB — Search & Fetch
// ============================================================
let pendingPBSplits = null;
let pendingPBName = "";

async function searchAthlete() {
  const firstName = document.getElementById('search-first').value.trim();
  const lastName = document.getElementById('search-last').value.trim();

  if (!firstName && !lastName) {
    alert('Please enter a name to search.');
    return;
  }

  const statusEl = document.getElementById('search-status');
  const resultsEl = document.getElementById('search-results');
  const splitsEl = document.getElementById('athlete-splits');
  const btn = document.getElementById('search-btn');

  statusEl.classList.remove('hidden');
  resultsEl.innerHTML = '';
  splitsEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Searching...';

  try {
    const params = new URLSearchParams();
    if (firstName) params.set('first_name', firstName);
    if (lastName) params.set('last_name', lastName);

    // Add filter params
    const eventVal = document.getElementById('filter-division')?.value || '';
    const sexVal = document.getElementById('filter-sex')?.value || '';
    const ageVal = document.getElementById('filter-age')?.value || '';
    if (eventVal) params.set('event', eventVal);
    if (sexVal) params.set('sex', sexVal);
    if (ageVal) params.set('age_class', ageVal);

    const resp = await fetch(`/api/search?${params}`);
    const data = await resp.json();

    statusEl.classList.add('hidden');
    btn.disabled = false;
    btn.textContent = 'Search Hyrox Results';

    if (data.error) {
      resultsEl.innerHTML = `<div class="text-center text-red-400 text-sm py-4">Error: ${data.error}</div>`;
      return;
    }

    if (!data.athletes || data.athletes.length === 0) {
      resultsEl.innerHTML = `
        <div class="text-center py-6">
          <div class="text-gray-400 text-sm mb-2">No results found for "${firstName} ${lastName}"</div>
          <p class="text-gray-500 text-xs">Try a different spelling or check <a href="https://results.hyrox.com/season-8/" target="_blank" class="text-hyrox-yellow underline">results.hyrox.com</a> directly.</p>
        </div>`;
      return;
    }

    resultsEl.innerHTML = `
      <div class="text-xs text-gray-400 mb-2">${data.count} result${data.count !== 1 ? 's' : ''} found</div>
      ${data.athletes.map((a, i) => `
        <button onclick='selectAthlete(${JSON.stringify(a).replace(/'/g, "&#39;")})'
          class="w-full text-left bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 hover:border-hyrox-yellow transition-colors">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-semibold text-sm">${a.name || 'Unknown'}</div>
              <div class="text-gray-400 text-xs">${[a.division, a.nationality, a.age_group].filter(Boolean).join(' · ')}</div>
            </div>
            <div class="text-right">
              <div class="text-hyrox-yellow font-bold">${a.overall_time || '--'}</div>
              <div class="text-gray-500 text-[10px]">${a.place ? '#' + a.place : ''}</div>
            </div>
          </div>
        </button>
      `).join('')}`;

  } catch (err) {
    statusEl.classList.add('hidden');
    btn.disabled = false;
    btn.textContent = 'Search Hyrox Results';
    resultsEl.innerHTML = `
      <div class="text-center py-6">
        <div class="text-red-400 text-sm mb-2">Could not connect to results server</div>
        <p class="text-gray-500 text-xs">Make sure the server is running with <code class="bg-hyrox-dark px-1 rounded">python3 server.py</code></p>
      </div>`;
  }
}

async function selectAthlete(athlete) {
  const splitsEl = document.getElementById('athlete-splits');
  const listEl = document.getElementById('pb-splits-list');

  if (!athlete.detail_url) {
    alert('No detail URL available for this athlete.');
    return;
  }

  // Show loading in splits area
  splitsEl.classList.remove('hidden');
  document.getElementById('pb-name').textContent = athlete.name || 'Loading...';
  document.getElementById('pb-overall').textContent = athlete.overall_time || '--:--';
  listEl.innerHTML = `
    <div class="px-5 py-4 text-center text-gray-400 text-sm">
      <div class="inline-flex items-center gap-2">
        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading splits...
      </div>
    </div>`;

  try {
    const resp = await fetch(`/api/athlete?url=${encodeURIComponent(athlete.detail_url)}`);
    const data = await resp.json();

    if (data.error || !data.splits) {
      listEl.innerHTML = `<div class="px-5 py-4 text-center text-red-400 text-sm">Could not load splits: ${data.error || 'Unknown error'}</div>`;
      return;
    }

    pendingPBSplits = data.splits;
    pendingPBName = athlete.name || '';

    // Map station icons
    const stationInfo = {};
    STATIONS.forEach(s => { stationInfo[s.id] = { icon: s.icon, name: s.name }; });

    // Build splits display
    const stationIds = ['ski_erg', 'sled_push', 'sled_pull', 'burpee_broad_jump', 'rowing', 'farmers_carry', 'sandbag_lunges', 'wall_balls'];
    let html = '';

    // Show runs
    for (let i = 1; i <= 8; i++) {
      const key = `run_${i}`;
      if (data.splits[key]) {
        html += `
          <div class="px-5 py-2.5 flex justify-between items-center">
            <span class="text-gray-400 text-sm">Run ${i}</span>
            <span class="font-medium text-sm">${fmt(data.splits[key])}</span>
          </div>`;
      }
    }

    // Show stations
    stationIds.forEach(id => {
      if (data.splits[id]) {
        const info = stationInfo[id] || { icon: '', name: id };
        html += `
          <div class="px-5 py-2.5 flex justify-between items-center">
            <span class="text-sm">${info.icon} ${info.name}</span>
            <span class="font-bold text-sm text-hyrox-yellow">${fmt(data.splits[id])}</span>
          </div>`;
      }
    });

    // Overall
    if (data.splits.overall) {
      document.getElementById('pb-overall').textContent = fmt(data.splits.overall);
    }

    if (!html) {
      html = `<div class="px-5 py-4 text-center text-gray-400 text-sm">No detailed splits found. The results page may have a different format.</div>`;
    }

    listEl.innerHTML = html;

  } catch (err) {
    listEl.innerHTML = `<div class="px-5 py-4 text-center text-red-400 text-sm">Failed to load splits: ${err.message}</div>`;
  }
}

function importPB() {
  if (!pendingPBSplits) return;

  // Set station times from PB splits
  const stationIds = ['ski_erg', 'sled_push', 'sled_pull', 'burpee_broad_jump', 'rowing', 'farmers_carry', 'sandbag_lunges', 'wall_balls'];
  stationIds.forEach(id => {
    if (pendingPBSplits[id] && pendingPBSplits[id] > 0) {
      state.stationTimes[id] = pendingPBSplits[id];
    }
  });

  // Set overall PB as target (or use it as baseline)
  if (pendingPBSplits.overall) {
    state.targetSeconds = pendingPBSplits.overall;
  }

  // Calculate avg run pace from splits
  let totalRunSec = 0;
  let runCount = 0;
  for (let i = 1; i <= 8; i++) {
    if (pendingPBSplits[`run_${i}`]) {
      totalRunSec += pendingPBSplits[`run_${i}`];
      runCount++;
    }
  }
  if (runCount > 0) {
    state.runPace = (totalRunSec / runCount) / 60; // convert to min/km
  }

  // Store PB for reference
  state.pb = { ...pendingPBSplits, name: pendingPBName };

  saveState();
  syncUIFromState();
  recalculate();
  showTab('setup');
}

// Allow Enter key to trigger search
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && (active.id === 'search-first' || active.id === 'search-last')) {
      searchAthlete();
    }
  }
});

// ============================================================
// Filters — Load & Populate
// ============================================================
let filtersData = null;

function toggleFilters() {
  const panel = document.getElementById('filters-panel');
  const chevron = document.getElementById('filters-chevron');
  panel.classList.toggle('hidden');
  chevron.classList.toggle('rotate-180');

  // Load filters on first open
  if (!filtersData && !panel.classList.contains('hidden')) {
    loadFilters();
  }
}

async function loadFilters() {
  const statusEl = document.getElementById('filters-status');
  statusEl.textContent = 'Loading filters from Hyrox...';
  try {
    const resp = await fetch('/api/filters');
    filtersData = await resp.json();
    populateFilterDropdowns();
    statusEl.textContent = `${filtersData.cities?.length || 0} race cities loaded`;
  } catch (err) {
    statusEl.textContent = 'Could not load filters. Searching all races.';
  }
}

function populateFilterDropdowns() {
  if (!filtersData) return;

  // Cities
  const citySelect = document.getElementById('filter-city');
  citySelect.innerHTML = '<option value="">All Time Ranking (all races)</option>';
  (filtersData.cities || []).forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i; // store index for lookup
    opt.textContent = c.city;
    citySelect.appendChild(opt);
  });

  // Genders
  const sexSelect = document.getElementById('filter-sex');
  sexSelect.innerHTML = '<option value="">Any</option>';
  (filtersData.genders || []).forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.value;
    opt.textContent = g.label;
    sexSelect.appendChild(opt);
  });

  // Age groups
  const ageSelect = document.getElementById('filter-age');
  ageSelect.innerHTML = '<option value="">Any</option>';
  (filtersData.age_groups || []).forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.value;
    opt.textContent = a.label;
    ageSelect.appendChild(opt);
  });
}

function onCityChange() {
  const citySelect = document.getElementById('filter-city');
  const divWrap = document.getElementById('division-wrap');
  const divSelect = document.getElementById('filter-division');

  const idx = citySelect.value;
  if (!idx || !filtersData) {
    divWrap.classList.add('hidden');
    divSelect.innerHTML = '<option value="">All Divisions</option>';
    return;
  }

  const city = filtersData.cities[parseInt(idx)];
  if (!city || !city.events) return;

  divWrap.classList.remove('hidden');
  divSelect.innerHTML = '<option value="">All Divisions</option>';
  city.events.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.value;
    opt.textContent = e.label;
    divSelect.appendChild(opt);
  });
}

// ============================================================
// Train Tab — Weekly Plan + Live Timer
// ============================================================

function getWeakStationIds() {
  const cat = state.category;
  return STATIONS.map(s => {
    const bm = s.benchmarks[cat];
    return { id: s.id, delta: state.stationTimes[s.id] - bm.good };
  }).sort((a, b) => b.delta - a.delta).map(s => s.id);
}

function renderWeeklyPlan() {
  const el = document.getElementById('weekly-plan');
  const weak = getWeakStationIds();
  const stationInfo = {};
  STATIONS.forEach(s => { stationInfo[s.id] = s; });

  const today = new Date().getDay(); // 0=Sun, 1=Mon

  el.innerHTML = WEEK_TEMPLATES.days.map((d, i) => {
    const dayNum = (i + 1) % 7; // Mon=1...Sun=0
    const isToday = dayNum === today;
    const isRest = d.type === 'rest';

    let focusStations = '';
    if (d.focus === 'weak') {
      focusStations = weak.slice(0, 3).map(id => stationInfo[id]?.icon || '').join(' ');
    } else if (d.focus === 'strong') {
      focusStations = weak.slice(-3).map(id => stationInfo[id]?.icon || '').join(' ');
    }

    const typeColors = {
      stations: 'bg-red-500/15 text-red-400',
      run: 'bg-blue-500/15 text-blue-400',
      sim: 'bg-hyrox-yellow/15 text-hyrox-yellow',
      rest: 'bg-gray-500/15 text-gray-400',
    };

    const typeLabels = {
      stations: 'STRENGTH',
      run: 'CARDIO',
      sim: 'SIMULATION',
      rest: 'REST',
    };

    return `
    <button onclick="${isRest ? '' : `startDayWorkout('${d.type}', '${d.focus || ''}')`}"
      class="w-full text-left bg-hyrox-gray/50 border ${isToday ? 'border-hyrox-yellow' : 'border-hyrox-gray'} rounded-xl p-4 ${isRest ? 'opacity-50' : 'hover:border-hyrox-yellow'} transition-colors">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 text-center">
            <div class="text-xs font-bold ${isToday ? 'text-hyrox-yellow' : 'text-gray-400'}">${d.day.slice(0, 3)}</div>
            ${isToday ? '<div class="text-[9px] text-hyrox-yellow">TODAY</div>' : ''}
          </div>
          <div>
            <div class="font-semibold text-sm">${d.label}</div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[d.type]}">${typeLabels[d.type]}</span>
              ${focusStations ? `<span class="text-sm">${focusStations}</span>` : ''}
            </div>
          </div>
        </div>
        ${!isRest ? '<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' : ''}
      </div>
    </button>`;
  }).join('');
}

// ---- Live Workout Timer ----
let activeWorkout = null;
let currentExIdx = 0;
let timerInterval = null;
let timerRunning = false;
let timerSeconds = 0;
let countingDown = false;
let totalElapsed = 0;
let elapsedInterval = null;

function startDayWorkout(type, focus) {
  const weak = getWeakStationIds();
  const workoutType = type === 'stations' ? (focus === 'weak' ? 'weak_stations' : 'strong_stations') : type;
  activeWorkout = generateWorkout(workoutType, weak);
  currentExIdx = 0;
  totalElapsed = 0;

  // Flatten exercises into a step list for the timer
  if (activeWorkout.type === 'drills') {
    activeWorkout.steps = [];
    activeWorkout.exercises.forEach(ex => {
      const sInfo = STATIONS.find(s => s.id === ex.stationId);
      const icon = sInfo ? sInfo.icon : '';
      if (ex.type === 'interval') {
        for (let r = 0; r < ex.rounds; r++) {
          activeWorkout.steps.push({
            phase: 'WORK', name: `${icon} ${ex.name}`, detail: ex.work.label,
            duration: ex.work.duration, tip: ex.tip, color: 'text-hyrox-yellow'
          });
          activeWorkout.steps.push({
            phase: 'REST', name: 'Rest', detail: `${ex.rest}s recovery`,
            duration: ex.rest, tip: 'Breathe. Shake it out.', color: 'text-green-400'
          });
        }
      } else if (ex.type === 'timed') {
        activeWorkout.steps.push({
          phase: 'WORK', name: `${icon} ${ex.name}`, detail: ex.label,
          duration: ex.duration, tip: ex.tip, color: 'text-hyrox-yellow'
        });
      }
    });
  } else if (activeWorkout.type === 'sim') {
    activeWorkout.steps = activeWorkout.segments.map(seg => {
      const sInfo = seg.station ? STATIONS.find(s => s.id === seg.station) : null;
      const icon = sInfo ? sInfo.icon : '🏃';
      return {
        phase: seg.type === 'run' ? 'RUN' : 'STATION',
        name: `${icon} ${seg.label}`,
        detail: seg.target || seg.distance || '',
        duration: 0, // untimed — user marks complete
        tip: seg.type === 'run' ? `Hold ${fmtPace(state.runPace)}/km pace.` : (sInfo?.tips?.[0] || ''),
        color: seg.type === 'run' ? 'text-blue-400' : 'text-hyrox-yellow',
      };
    });
  } else if (activeWorkout.type === 'interval') {
    activeWorkout.steps = activeWorkout.segments.map(seg => ({
      phase: seg.type.toUpperCase(),
      name: seg.label,
      detail: seg.distance || '',
      duration: seg.duration,
      tip: seg.type === 'work' ? `Target pace: ${fmtPace(state.runPace)}/km` : 'Easy breathing',
      color: seg.type === 'work' ? 'text-blue-400' : seg.type === 'rest' ? 'text-green-400' : 'text-gray-400',
    }));
  }

  // Show active view
  document.getElementById('train-plan').classList.add('hidden');
  document.getElementById('train-active').classList.remove('hidden');
  document.getElementById('workout-title').textContent = activeWorkout.name;

  // Start elapsed timer
  clearInterval(elapsedInterval);
  elapsedInterval = setInterval(() => {
    totalElapsed++;
    document.getElementById('workout-elapsed').textContent = fmt(totalElapsed);
  }, 1000);

  renderCurrentExercise();
  renderExerciseList();
}

function exitWorkout() {
  clearInterval(timerInterval);
  clearInterval(elapsedInterval);
  timerRunning = false;
  activeWorkout = null;
  document.getElementById('train-plan').classList.remove('hidden');
  document.getElementById('train-active').classList.add('hidden');
}

function renderCurrentExercise() {
  if (!activeWorkout || !activeWorkout.steps) return;
  const step = activeWorkout.steps[currentExIdx];
  if (!step) return;

  const phaseEl = document.getElementById('exercise-phase');
  const nameEl = document.getElementById('exercise-name');
  const detailEl = document.getElementById('exercise-detail');
  const tipEl = document.getElementById('exercise-tip');
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const ring = document.getElementById('timer-ring');

  phaseEl.textContent = step.phase;
  phaseEl.className = `text-xs font-semibold uppercase tracking-wider mb-2 ${step.color}`;
  nameEl.textContent = step.name;
  detailEl.textContent = step.detail;
  tipEl.textContent = step.tip || '';

  // Progress bar
  const pct = activeWorkout.steps.length > 0 ? ((currentExIdx) / activeWorkout.steps.length) * 100 : 0;
  document.getElementById('workout-progress').style.width = pct + '%';

  // Reset timer
  clearInterval(timerInterval);
  timerRunning = false;
  const circumference = 2 * Math.PI * 16;

  if (step.duration > 0) {
    // Countdown timer
    countingDown = true;
    timerSeconds = step.duration;
    timerDisplay.textContent = fmt(timerSeconds);
    timerLabel.textContent = 'tap Start';
    ring.setAttribute('stroke-dashoffset', '0');
    ring.setAttribute('stroke', step.phase === 'REST' ? '#22C55E' : '#F5E600');
  } else {
    // Stopwatch (for untimed segments like runs/sims)
    countingDown = false;
    timerSeconds = 0;
    timerDisplay.textContent = '0:00';
    timerLabel.textContent = 'tap Start → Next when done';
    ring.setAttribute('stroke-dashoffset', '0');
    ring.setAttribute('stroke', step.color === 'text-blue-400' ? '#3B82F6' : '#F5E600');
  }

  document.getElementById('btn-pause').textContent = 'Start';
  renderExerciseList();
}

function toggleTimer() {
  if (timerRunning) {
    // Pause
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('btn-pause').textContent = 'Resume';
  } else {
    // Start
    timerRunning = true;
    document.getElementById('btn-pause').textContent = 'Pause';
    document.getElementById('timer-label').textContent = '';
    const circumference = 2 * Math.PI * 16;
    const ring = document.getElementById('timer-ring');
    const totalDuration = countingDown ? timerSeconds : 1; // for ring animation

    timerInterval = setInterval(() => {
      if (countingDown) {
        timerSeconds--;
        if (timerSeconds <= 0) {
          timerSeconds = 0;
          clearInterval(timerInterval);
          timerRunning = false;
          // Auto-advance
          document.getElementById('timer-display').textContent = '0:00';
          document.getElementById('btn-pause').textContent = 'Done ✓';
          ring.setAttribute('stroke-dashoffset', String(circumference));
          // Beep feedback (visual flash)
          document.getElementById('exercise-card').classList.add('border-green-500');
          setTimeout(() => {
            document.getElementById('exercise-card').classList.remove('border-green-500');
            if (currentExIdx < activeWorkout.steps.length - 1) {
              nextExercise();
            }
          }, 1500);
          return;
        }
        const step = activeWorkout.steps[currentExIdx];
        const elapsed = step.duration - timerSeconds;
        const pct = elapsed / step.duration;
        ring.setAttribute('stroke-dashoffset', String(pct * circumference));
      } else {
        timerSeconds++;
      }
      document.getElementById('timer-display').textContent = fmt(timerSeconds);
    }, 1000);
  }
}

function nextExercise() {
  if (!activeWorkout) return;
  if (currentExIdx < activeWorkout.steps.length - 1) {
    currentExIdx++;
    renderCurrentExercise();
  } else {
    // Workout complete
    clearInterval(timerInterval);
    clearInterval(elapsedInterval);
    timerRunning = false;
    document.getElementById('exercise-card').innerHTML = `
      <div class="py-8 text-center">
        <div class="text-4xl mb-3">🏁</div>
        <div class="text-xl font-extrabold text-hyrox-yellow mb-2">Workout Complete!</div>
        <div class="text-gray-400 text-sm">Total time: ${fmt(totalElapsed)}</div>
        <button onclick="exitWorkout()" class="mt-4 px-6 py-2.5 bg-hyrox-yellow text-hyrox-dark font-semibold rounded-xl text-sm">Back to Plan</button>
      </div>`;
  }
}

function prevExercise() {
  if (!activeWorkout || currentExIdx === 0) return;
  currentExIdx--;
  renderCurrentExercise();
}

function renderExerciseList() {
  if (!activeWorkout || !activeWorkout.steps) return;
  const el = document.getElementById('exercise-list-mini');
  el.innerHTML = activeWorkout.steps.map((step, i) => {
    const isCurrent = i === currentExIdx;
    const isDone = i < currentExIdx;
    return `
    <div class="flex items-center gap-2 py-1 ${isCurrent ? 'text-white' : isDone ? 'text-gray-600 line-through' : 'text-gray-500'} text-xs">
      <span class="w-4 text-center">${isDone ? '✓' : isCurrent ? '▶' : '·'}</span>
      <span class="${step.color}">${step.phase}</span>
      <span class="flex-1 truncate">${step.name}</span>
      ${step.duration > 0 ? `<span class="text-gray-600">${fmt(step.duration)}</span>` : ''}
    </div>`;
  }).join('');
}

// ============================================================
// Sync full UI from state
// ============================================================
function syncUIFromState() {
  syncTargetInputs();
  syncCategoryButtons();
  syncPaceSlider();
  renderStationInputs();
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  syncUIFromState();
  recalculate();
  renderChecklist();
  renderStrategyTips();
  renderNutrition();
});
