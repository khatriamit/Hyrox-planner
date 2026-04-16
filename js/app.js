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
const TABS = ['train', 'import', 'setup', 'stations', 'analysis', 'raceday'];

function showTab(tab) {
  TABS.forEach(t => {
    document.getElementById(`section-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-${t}`);
    if (t === tab) { btn.classList.add('tab-active'); btn.classList.remove('text-gray-400'); }
    else { btn.classList.remove('tab-active'); btn.classList.add('text-gray-400'); }
  });
  window.scrollTo(0, 0);
  if (tab === 'analysis') renderAnalysis();
  if (tab === 'import') {
    renderImportLanding();
    loadFilters(); // ensure dropdowns are populated
  }
  if (tab === 'train') {
    if (state.raceDate && typeof renderPeriodizedPlan === 'function') {
      renderPeriodizedPlan();
    } else {
      renderWeeklyPlan();
    }
  }
}

// Show event cards as landing state for Import tab (hyresult.com style)
function renderImportLanding() {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl || resultsEl.innerHTML.trim()) return; // only on fresh load

  const recentEvents = [
    { name: 'Bengaluru 2026', date: 'Mar 2026', slug: 'bengaluru', status: 'upcoming', athletes: '6,820', flag: '🇮🇳', isIndia: true },
    { name: 'London 2025', date: 'Nov 2025', slug: 'london', status: 'recent', athletes: '40,000', flag: '🇬🇧' },
    { name: 'Singapore 2025', date: 'Oct 2025', slug: 'singapore', status: 'recent', athletes: '2,400', flag: '🇸🇬' },
    { name: 'Mumbai 2025', date: 'May 2025', slug: 'mumbai', status: 'recent', athletes: '1,650', flag: '🇮🇳', isIndia: true },
    { name: 'Cologne 2026', date: 'Feb 2026', slug: 'cologne', status: 'upcoming', athletes: '—', flag: '🇩🇪' },
    { name: 'Rotterdam 2026', date: 'Apr 2026', slug: 'rotterdam', status: 'upcoming', athletes: '—', flag: '🇳🇱' },
  ];

  resultsEl.innerHTML = `
    <div class="mb-3 flex items-center gap-2">
      <div class="w-1 h-4 bg-hyrox-green"></div>
      <h3 class="text-white text-sm font-semibold uppercase tracking-wider">Recent events</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      ${recentEvents.map(e => `
        <div onclick="document.getElementById('search-last').focus()" class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-hyrox-green/40 hover:bg-zinc-900/70 transition-colors">
          <div class="flex items-start gap-3">
            <div class="text-3xl leading-none flex-shrink-0">${e.flag}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-white font-semibold text-sm truncate">HYROX ${e.name}</h4>
                ${e.isIndia ? '<span class="bg-orange-500/20 text-orange-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">🔥 India</span>' : ''}
              </div>
              <div class="text-zinc-500 text-xs">${e.date} · ${e.athletes} athletes</div>
              ${e.status === 'upcoming'
                ? '<span class="inline-block mt-2 bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-medium">Upcoming</span>'
                : '<span class="inline-block mt-2 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-medium">Recent</span>'
              }
            </div>
            <svg class="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
      <p class="text-zinc-400 text-xs mb-2">Enter your name above to find your result</p>
      <p class="text-zinc-600 text-[10px]">Data from results.hyrox.com · All seasons</p>
    </div>
  `;
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
  resultsEl.classList.remove('hidden');
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
    btn.textContent = 'Show Results';

    if (data.error) {
      resultsEl.innerHTML = `<div class="border border-red-900/50 bg-red-950/20 rounded-xl p-4 text-center text-red-400 text-sm">Error: ${data.error}</div>`;
      return;
    }

    if (!data.athletes || data.athletes.length === 0) {
      resultsEl.innerHTML = `
        <div class="border border-zinc-800 rounded-xl p-8 text-center">
          <div class="text-zinc-300 text-sm mb-2">No results found for "${firstName} ${lastName}"</div>
          <p class="text-zinc-500 text-xs">Try a different spelling or check <a href="https://results.hyrox.com/season-8/" target="_blank" class="text-hyrox-green hover:underline">results.hyrox.com</a> directly.</p>
        </div>`;
      return;
    }

    // Update count display
    const countEl = document.getElementById('rankings-count');
    if (countEl) countEl.textContent = `(${data.count})`;

    // hyresult.com-style ranking table — # | # AG | Name+Flag | AG badge | Time | Analyze
    resultsEl.innerHTML = `
      <div class="border border-zinc-800 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-zinc-900/50 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <th class="text-left font-medium py-2.5 px-3 w-10">#</th>
              <th class="text-left font-medium py-2.5 px-2 w-10 hidden sm:table-cell" title="Age Group Rank"># AG</th>
              <th class="text-left font-medium py-2.5 px-2">Athlete</th>
              <th class="text-left font-medium py-2.5 px-2 w-20 hidden sm:table-cell">Age</th>
              <th class="text-right font-medium py-2.5 px-2 w-20">Time</th>
              <th class="text-right font-medium py-2.5 px-3 w-20">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            ${data.athletes.map((a, i) => {
              const isTop = i === 0;
              const rowClass = isTop
                ? 'bg-zinc-900 border-l-2 border-l-hyrox-green'
                : 'hover:bg-zinc-900/40';
              const flag = getCountryFlag(a.nationality || a.city);
              const ageGroup = a.age_group || a.age_class || '';
              return `
                <tr class="${rowClass} transition-colors">
                  <td class="py-3 px-3 text-zinc-400 font-mono text-xs">${a.place || '-'}</td>
                  <td class="py-3 px-2 text-zinc-500 font-mono text-xs hidden sm:table-cell">${a.age_place || '—'}</td>
                  <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                      <span class="text-base leading-none flex-shrink-0">${flag}</span>
                      <span class="text-white font-semibold text-sm truncate">${a.name || 'Unknown'}</span>
                    </div>
                    <div class="text-zinc-600 text-[10px] sm:hidden mt-0.5 ml-6">${ageGroup} · ${a.city || ''}</div>
                  </td>
                  <td class="py-3 px-2 hidden sm:table-cell">
                    ${ageGroup ? `<span class="inline-block bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-medium">${ageGroup}</span>` : ''}
                  </td>
                  <td class="py-3 px-2 text-right font-mono text-white text-sm">${a.overall_time || '--:--'}</td>
                  <td class="py-3 px-3 text-right">
                    <button onclick='selectAthlete(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors">
                      <span class="hidden sm:inline">Analyze</span>
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="text-zinc-600 text-[10px] text-center mt-3">Click <strong>Analyze</strong> to view splits and import as your PB</p>`;

  } catch (err) {
    statusEl.classList.add('hidden');
    btn.disabled = false;
    btn.textContent = 'Search';
    resultsEl.innerHTML = `
      <div class="border border-zinc-800 rounded-xl p-8 text-center">
        <div class="text-red-400 text-sm mb-2">Could not connect to results server</div>
        <p class="text-zinc-500 text-xs">Make sure the server is running</p>
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

  // Show loading in splits area, hide results table
  splitsEl.classList.remove('hidden');
  document.getElementById('search-results').classList.add('hidden');
  document.getElementById('pb-participant-info').innerHTML = `<div class="text-zinc-400 text-sm">${athlete.name || 'Loading...'}</div>`;
  document.getElementById('pb-stats-cards').innerHTML = '';
  listEl.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-zinc-500 text-sm">Loading data ...</td></tr>`;
  window.scrollTo(0, 0);

  try {
    const resp = await fetch(`/api/athlete?url=${encodeURIComponent(athlete.detail_url)}`);
    const data = await resp.json();

    if (data.error || !data.splits) {
      listEl.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-red-400 text-sm">Could not load splits: ${data.error || 'Unknown error'}</td></tr>`;
      return;
    }

    pendingPBSplits = data.splits;
    pendingPBName = athlete.name || '';

    const overallTime = data.splits.overall ? fmt(data.splits.overall) : '--:--';
    const flag = getCountryFlag(athlete.nationality || athlete.city);
    const ageGroup = athlete.age_group || athlete.age_class || '';

    // Update breadcrumb
    const bcEvent = document.getElementById('breadcrumb-event');
    const bcSep = document.getElementById('breadcrumb-sep');
    const bcDiv = document.getElementById('breadcrumb-division');
    if (bcEvent) bcEvent.textContent = athlete.city || 'Rankings';
    if (bcSep) bcSep.style.display = 'inline';
    if (bcDiv) { bcDiv.style.display = 'inline'; bcDiv.textContent = athlete.name || 'Athlete'; }

    // Populate athlete hero — hyresult.com style
    const infoEl = document.getElementById('pb-participant-info');
    infoEl.innerHTML = `
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-3xl leading-none flex-shrink-0">${flag}</span>
          <div class="min-w-0">
            <h3 class="text-white text-xl font-semibold truncate">${athlete.name || 'Athlete'}</h3>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${ageGroup ? `<span class="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-medium">${ageGroup}</span>` : ''}
              ${athlete.city ? `<span class="text-zinc-500 text-xs">${athlete.city}</span>` : ''}
              ${athlete.place ? `<span class="text-zinc-500 text-xs">· Rank #${athlete.place}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white font-mono font-semibold text-2xl">${overallTime}</div>
          <div class="text-zinc-500 text-[10px] uppercase tracking-wider">Finish time</div>
        </div>
      </div>
    `;

    // Stats cards — compute from splits
    const stationIds = ['ski_erg', 'sled_push', 'sled_pull', 'burpee_broad_jump', 'rowing', 'farmers_carry', 'sandbag_lunges', 'wall_balls'];
    let totalRunSec = 0, runCount = 0;
    for (let i = 1; i <= 8; i++) {
      if (data.splits[`run_${i}`]) { totalRunSec += data.splits[`run_${i}`]; runCount++; }
    }
    let totalStationSec = 0;
    stationIds.forEach(s => { if (data.splits[s]) totalStationSec += data.splits[s]; });
    const avgRunSec = runCount > 0 ? Math.round(totalRunSec / runCount) : 0;
    const roxzoneSec = data.splits.roxzone || 0;

    const statsEl = document.getElementById('pb-stats-cards');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div class="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Avg run</div>
          <div class="text-white font-mono font-semibold text-base">${avgRunSec > 0 ? fmt(avgRunSec) : '—'}</div>
          <div class="text-zinc-600 text-[10px] mt-0.5">per 1km</div>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div class="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Stations</div>
          <div class="text-white font-mono font-semibold text-base">${totalStationSec > 0 ? fmt(totalStationSec) : '—'}</div>
          <div class="text-zinc-600 text-[10px] mt-0.5">total work</div>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div class="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Roxzone</div>
          <div class="text-white font-mono font-semibold text-base">${roxzoneSec > 0 ? fmt(roxzoneSec) : '—'}</div>
          <div class="text-zinc-600 text-[10px] mt-0.5">transitions</div>
        </div>
      `;
    }

    // Map station icons
    const stationInfo = {};
    STATIONS.forEach(s => { stationInfo[s.id] = { icon: s.icon, name: s.name }; });

    // Build splits — hyresult.com style: # | Split | Time | %
    let html = '';
    const totalSec = data.splits.overall || 1;
    let stepIdx = 1;

    for (let i = 0; i < 8; i++) {
      const runKey = `run_${i + 1}`;
      if (data.splits[runKey]) {
        const pct = ((data.splits[runKey] / totalSec) * 100).toFixed(1);
        html += `<tr class="hover:bg-zinc-900/50 transition-colors">
          <td class="py-2.5 px-3 text-zinc-600 font-mono text-xs">${stepIdx++}</td>
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-2">
              <span class="text-zinc-500 text-sm">🏃</span>
              <span class="text-zinc-300 text-sm">Running ${i + 1}</span>
              <span class="text-zinc-600 text-[10px]">· 1km</span>
            </div>
          </td>
          <td class="py-2.5 px-3 text-right font-mono text-zinc-300 text-sm">${fmt(data.splits[runKey])}</td>
          <td class="py-2.5 px-3 text-right font-mono text-zinc-600 text-[10px] hidden sm:table-cell">${pct}%</td>
        </tr>`;
      }
      const stId = stationIds[i];
      if (data.splits[stId]) {
        const info = stationInfo[stId] || { name: stId, icon: '🏋️' };
        const pct = ((data.splits[stId] / totalSec) * 100).toFixed(1);
        html += `<tr class="hover:bg-zinc-900/50 transition-colors">
          <td class="py-2.5 px-3 text-zinc-600 font-mono text-xs">${stepIdx++}</td>
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-2">
              <span class="text-sm">${info.icon || '🏋️'}</span>
              <span class="text-white font-medium text-sm">${info.name}</span>
            </div>
          </td>
          <td class="py-2.5 px-3 text-right font-mono text-hyrox-green font-semibold text-sm">${fmt(data.splits[stId])}</td>
          <td class="py-2.5 px-3 text-right font-mono text-zinc-600 text-[10px] hidden sm:table-cell">${pct}%</td>
        </tr>`;
      }
    }

    if (data.splits.roxzone) {
      const pct = ((data.splits.roxzone / totalSec) * 100).toFixed(1);
      html += `<tr class="bg-zinc-900/30">
        <td class="py-2.5 px-3 text-zinc-600 font-mono text-xs">—</td>
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-2">
            <span class="text-zinc-500">⏱</span>
            <span class="text-zinc-400 text-sm italic">Roxzone</span>
            <span class="text-zinc-600 text-[10px]">· transitions</span>
          </div>
        </td>
        <td class="py-2.5 px-3 text-right font-mono text-zinc-400 text-sm">${fmt(data.splits.roxzone)}</td>
        <td class="py-2.5 px-3 text-right font-mono text-zinc-600 text-[10px] hidden sm:table-cell">${pct}%</td>
      </tr>`;
    }

    if (data.splits.overall) {
      html += `<tr class="bg-zinc-900 border-t-2 border-hyrox-green/50">
        <td class="py-3 px-3"></td>
        <td class="py-3 px-3 text-white font-semibold uppercase text-xs tracking-wider">Total</td>
        <td class="py-3 px-3 text-right font-mono font-semibold text-hyrox-green text-base">${fmt(data.splits.overall)}</td>
        <td class="py-3 px-3 text-right font-mono text-hyrox-green text-[10px] hidden sm:table-cell">100%</td>
      </tr>`;
    }

    if (!html) {
      html = `<tr><td colspan="4" class="py-6 text-center text-zinc-500 text-sm">No detailed splits available for this athlete.</td></tr>`;
    }

    listEl.innerHTML = html;

  } catch (err) {
    listEl.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-red-400 text-sm">Failed to load splits: ${err.message}</td></tr>`;
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
  showTab('train');
}

// Reset PB search state (back from detail to list)
function resetPBSearch() {
  document.getElementById('athlete-splits')?.classList.add('hidden');
  document.getElementById('search-results')?.classList.remove('hidden');
  const bcSep = document.getElementById('breadcrumb-sep');
  const bcDiv = document.getElementById('breadcrumb-division');
  if (bcSep) bcSep.style.display = 'none';
  if (bcDiv) bcDiv.style.display = 'none';
}

// Map country name / code to flag emoji — hyresult.com uses inline flag icons
function getCountryFlag(input) {
  if (!input) return '🏳️';
  const s = input.toString().trim().toUpperCase();

  // Map of common Hyrox race nations
  const flags = {
    IND: '🇮🇳', IN: '🇮🇳', INDIA: '🇮🇳', 'NEW DELHI': '🇮🇳', MUMBAI: '🇮🇳', BENGALURU: '🇮🇳', BANGALORE: '🇮🇳', DELHI: '🇮🇳',
    USA: '🇺🇸', US: '🇺🇸', 'UNITED STATES': '🇺🇸',
    GBR: '🇬🇧', UK: '🇬🇧', 'GREAT BRITAIN': '🇬🇧', ENGLAND: '🇬🇧', LONDON: '🇬🇧', MANCHESTER: '🇬🇧', GLASGOW: '🇬🇧', BIRMINGHAM: '🇬🇧',
    GER: '🇩🇪', DE: '🇩🇪', GERMANY: '🇩🇪', BERLIN: '🇩🇪', MUNICH: '🇩🇪', COLOGNE: '🇩🇪', HAMBURG: '🇩🇪', FRANKFURT: '🇩🇪', STUTTGART: '🇩🇪',
    FRA: '🇫🇷', FR: '🇫🇷', FRANCE: '🇫🇷', PARIS: '🇫🇷',
    ESP: '🇪🇸', SPAIN: '🇪🇸', MADRID: '🇪🇸', BARCELONA: '🇪🇸', MALAGA: '🇪🇸',
    ITA: '🇮🇹', ITALY: '🇮🇹', MILAN: '🇮🇹', ROME: '🇮🇹', BOLOGNA: '🇮🇹',
    NED: '🇳🇱', NL: '🇳🇱', NETHERLANDS: '🇳🇱', AMSTERDAM: '🇳🇱', ROTTERDAM: '🇳🇱',
    AUS: '🇦🇺', AU: '🇦🇺', AUSTRALIA: '🇦🇺', SYDNEY: '🇦🇺', MELBOURNE: '🇦🇺', BRISBANE: '🇦🇺', PERTH: '🇦🇺',
    CAN: '🇨🇦', CANADA: '🇨🇦', TORONTO: '🇨🇦', VANCOUVER: '🇨🇦',
    POL: '🇵🇱', POLAND: '🇵🇱', WARSAW: '🇵🇱',
    SGP: '🇸🇬', SG: '🇸🇬', SINGAPORE: '🇸🇬',
    HKG: '🇭🇰', HK: '🇭🇰', 'HONG KONG': '🇭🇰',
    JPN: '🇯🇵', JP: '🇯🇵', JAPAN: '🇯🇵', TOKYO: '🇯🇵',
    KOR: '🇰🇷', KR: '🇰🇷', 'SOUTH KOREA': '🇰🇷', KOREA: '🇰🇷', SEOUL: '🇰🇷',
    CHN: '🇨🇳', CN: '🇨🇳', CHINA: '🇨🇳', WUHAN: '🇨🇳', SHANGHAI: '🇨🇳',
    UAE: '🇦🇪', DUBAI: '🇦🇪',
    BRA: '🇧🇷', BRAZIL: '🇧🇷',
    MEX: '🇲🇽', MEXICO: '🇲🇽', MONTERREY: '🇲🇽',
    IRL: '🇮🇪', IRELAND: '🇮🇪', DUBLIN: '🇮🇪',
    AUT: '🇦🇹', AUSTRIA: '🇦🇹', VIENNA: '🇦🇹',
    SUI: '🇨🇭', CH: '🇨🇭', SWITZERLAND: '🇨🇭', ZURICH: '🇨🇭',
    SWE: '🇸🇪', SWEDEN: '🇸🇪', STOCKHOLM: '🇸🇪',
    NOR: '🇳🇴', NORWAY: '🇳🇴', OSLO: '🇳🇴',
    DEN: '🇩🇰', DK: '🇩🇰', DENMARK: '🇩🇰', COPENHAGEN: '🇩🇰',
    FIN: '🇫🇮', FINLAND: '🇫🇮', HELSINKI: '🇫🇮',
    BEL: '🇧🇪', BELGIUM: '🇧🇪', BRUSSELS: '🇧🇪',
    POR: '🇵🇹', PORTUGAL: '🇵🇹', LISBON: '🇵🇹',
    CZE: '🇨🇿', CZECH: '🇨🇿', PRAGUE: '🇨🇿',
    NZL: '🇳🇿', NZ: '🇳🇿', 'NEW ZEALAND': '🇳🇿', AUCKLAND: '🇳🇿',
    RSA: '🇿🇦', 'SOUTH AFRICA': '🇿🇦', JOHANNESBURG: '🇿🇦', 'CAPE TOWN': '🇿🇦',
  };

  // Try direct lookup
  if (flags[s]) return flags[s];

  // Try first 3 chars
  if (flags[s.substring(0, 3)]) return flags[s.substring(0, 3)];

  // Try to find any key contained in the input
  for (const k of Object.keys(flags)) {
    if (s.includes(k)) return flags[k];
  }

  return '🏳️';
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
  // Legacy — filters are always visible now. Just load them.
  if (!filtersData) loadFilters();
}

// Fallback filter data when API is unavailable — keeps dropdowns functional
const FALLBACK_FILTERS = {
  cities: [
    { city: 'London 2025', events: [] },
    { city: 'Bengaluru 2026', events: [] },
    { city: 'Mumbai 2025', events: [] },
    { city: 'Singapore 2025', events: [] },
    { city: 'Cologne 2026', events: [] },
    { city: 'Rotterdam 2026', events: [] },
    { city: 'Warsaw 2026', events: [] },
    { city: 'Malaga 2026', events: [] },
    { city: 'Monterrey 2026', events: [] },
    { city: 'Brisbane 2026', events: [] },
    { city: 'Wuhan 2026', events: [] },
    { city: 'Bologna 2026', events: [] },
  ],
  genders: [
    { value: 'M', label: 'Men' },
    { value: 'W', label: 'Women' },
  ],
  age_groups: [
    { value: '16-24', label: '16-24' },
    { value: '25-29', label: '25-29' },
    { value: '30-34', label: '30-34' },
    { value: '35-39', label: '35-39' },
    { value: '40-44', label: '40-44' },
    { value: '45-49', label: '45-49' },
    { value: '50-54', label: '50-54' },
    { value: '55-59', label: '55-59' },
    { value: '60-64', label: '60-64' },
    { value: '65+', label: '65+' },
  ],
  nations: [
    { value: 'IND', label: 'India 🇮🇳' },
    { value: 'GBR', label: 'United Kingdom 🇬🇧' },
    { value: 'USA', label: 'United States 🇺🇸' },
    { value: 'GER', label: 'Germany 🇩🇪' },
    { value: 'AUS', label: 'Australia 🇦🇺' },
    { value: 'SGP', label: 'Singapore 🇸🇬' },
    { value: 'NED', label: 'Netherlands 🇳🇱' },
    { value: 'FRA', label: 'France 🇫🇷' },
    { value: 'ESP', label: 'Spain 🇪🇸' },
    { value: 'ITA', label: 'Italy 🇮🇹' },
    { value: 'POL', label: 'Poland 🇵🇱' },
    { value: 'CAN', label: 'Canada 🇨🇦' },
    { value: 'HKG', label: 'Hong Kong 🇭🇰' },
    { value: 'UAE', label: 'UAE 🇦🇪' },
    { value: 'JPN', label: 'Japan 🇯🇵' },
    { value: 'BRA', label: 'Brazil 🇧🇷' },
  ],
};

async function loadFilters() {
  const statusEl = document.getElementById('filters-status');
  if (statusEl) statusEl.textContent = 'Loading filters...';

  // Populate with fallback immediately so dropdowns are always usable
  if (!filtersData) {
    filtersData = FALLBACK_FILTERS;
    populateFilterDropdowns();
  }

  // Try to fetch real data and replace if successful
  try {
    const resp = await fetch('/api/filters');
    if (!resp.ok) throw new Error('API not ok');
    const data = await resp.json();
    if (data && (data.cities?.length || data.genders?.length)) {
      // Merge: keep fallback nations (API may not return them)
      filtersData = { ...FALLBACK_FILTERS, ...data };
      populateFilterDropdowns();
      if (statusEl) statusEl.textContent = `${filtersData.cities?.length || 0} race cities loaded`;
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = '';
    // fallback already populated — dropdowns stay functional
  }
}

function populateFilterDropdowns() {
  if (!filtersData) return;

  // Cities (Races)
  const citySelect = document.getElementById('filter-city');
  if (citySelect) {
    const currentVal = citySelect.value;
    citySelect.innerHTML = '<option value="">All events</option>';
    (filtersData.cities || []).forEach((c, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = c.city;
      citySelect.appendChild(opt);
    });
    if (currentVal) citySelect.value = currentVal;
  }

  // Genders
  const sexSelect = document.getElementById('filter-sex');
  if (sexSelect) {
    const currentVal = sexSelect.value;
    sexSelect.innerHTML = '<option value="">All genders</option>';
    (filtersData.genders || []).forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.value;
      opt.textContent = g.label;
      sexSelect.appendChild(opt);
    });
    if (currentVal) sexSelect.value = currentVal;
  }

  // Age groups
  const ageSelect = document.getElementById('filter-age');
  if (ageSelect) {
    const currentVal = ageSelect.value;
    ageSelect.innerHTML = '<option value="">All AGs</option>';
    (filtersData.age_groups || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.value;
      opt.textContent = a.label;
      ageSelect.appendChild(opt);
    });
    if (currentVal) ageSelect.value = currentVal;
  }

  // Nationalities
  const natSelect = document.getElementById('filter-nationality');
  if (natSelect) {
    const currentVal = natSelect.value;
    natSelect.innerHTML = '<option value="">All nations</option>';
    (filtersData.nations || FALLBACK_FILTERS.nations).forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.value;
      opt.textContent = n.label;
      natSelect.appendChild(opt);
    });
    if (currentVal) natSelect.value = currentVal;
  }
}

function onCityChange() {
  const citySelect = document.getElementById('filter-city');
  const divSelect = document.getElementById('filter-division');
  if (!divSelect) return;

  const idx = citySelect.value;
  if (!idx || !filtersData) {
    divSelect.classList.add('hidden');
    divSelect.innerHTML = '<option value="">All divisions</option>';
    return;
  }

  const city = filtersData.cities[parseInt(idx)];
  if (!city || !city.events) return;

  divSelect.classList.remove('hidden');
  divSelect.innerHTML = '<option value="">All divisions</option>';
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

  // Re-render the plan to reflect updated recovery
  if (state.raceDate && typeof renderPeriodizedPlan === 'function') {
    renderPeriodizedPlan();
  } else {
    renderWeeklyPlan();
  }
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
    // Workout complete — show post-workout analysis
    clearInterval(timerInterval);
    clearInterval(elapsedInterval);
    timerRunning = false;

    // Log session to recovery matrix
    const workoutMeta = {
      type: activeWorkout.type === 'drills' ? 'stations' : activeWorkout.type === 'interval' ? 'run' : activeWorkout.type === 'sim' ? 'sim' : 'stations',
      intensity: activeWorkout.steps.some(s => s.phase === 'WORK') ? 'moderate' : 'easy',
      duration: Math.round(totalElapsed / 60),
    };
    if (typeof markSessionComplete === 'function') {
      markSessionComplete(workoutMeta.type, workoutMeta.intensity, workoutMeta.duration);
    }

    // Save to workout history
    saveWorkoutToHistory({
      ...workoutMeta,
      name: activeWorkout.name || 'Workout',
      totalSeconds: totalElapsed,
      stepsCompleted: activeWorkout.steps.length,
      date: new Date().toISOString(),
    });

    showPostWorkoutAnalysis(totalElapsed, workoutMeta);
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
// Workout History — persisted to localStorage
// ============================================================
const WORKOUT_HISTORY_KEY = 'hyrox_workout_history';

function loadWorkoutHistory() {
  try {
    const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveWorkoutToHistory(workout) {
  const history = loadWorkoutHistory();
  history.unshift(workout); // newest first
  // Keep last 100
  if (history.length > 100) history.length = 100;
  localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
}

// ============================================================
// Post-Workout Analysis — shown after completing a workout
// ============================================================
function showPostWorkoutAnalysis(totalSeconds, meta) {
  const totalMins = Math.round(totalSeconds / 60);
  const history = loadWorkoutHistory();
  const sameTypeHistory = history.filter(h => h.type === meta.type).slice(1, 6); // exclude current, last 5

  // Generate wearable workout data (HR zones, calories, etc.)
  const wearableData = getPostWorkoutWearableData(meta, totalSeconds);

  // Calculate trends
  let trendHtml = '';
  if (sameTypeHistory.length > 0) {
    const avgPrevDuration = sameTypeHistory.reduce((s, h) => s + h.totalSeconds, 0) / sameTypeHistory.length;
    const delta = totalSeconds - avgPrevDuration;
    const deltaMin = Math.abs(delta / 60).toFixed(1);
    const isFaster = delta < 0;
    trendHtml = `
      <div class="flex items-center gap-2 mt-2 p-3 rounded-xl ${isFaster ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}">
        <span class="text-lg">${isFaster ? '📈' : '📉'}</span>
        <div class="text-xs">
          <span class="font-semibold ${isFaster ? 'text-green-400' : 'text-orange-400'}">${isFaster ? deltaMin + ' min faster' : deltaMin + ' min slower'}</span>
          <span class="text-gray-400"> vs your avg ${meta.type} session (${Math.round(avgPrevDuration / 60)} min)</span>
        </div>
      </div>`;
  }

  // Recovery impact preview
  const recovery = typeof calculateRecoveryScore === 'function' ? calculateRecoveryScore() : null;
  let recoveryImpactHtml = '';
  if (recovery) {
    const zone = recovery.zone;
    recoveryImpactHtml = `
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4">
        <div class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Recovery Impact</div>
        <div class="flex items-center gap-3 mb-3">
          <span class="text-lg">${zone.icon}</span>
          <div>
            <div class="font-semibold text-sm ${zone.color}">${zone.label}</div>
            <div class="text-[10px] text-gray-500">Updated after this session</div>
          </div>
          <div class="ml-auto text-right">
            <div class="text-lg font-bold">${Math.round(recovery.overall * 100)}%</div>
            <div class="text-[9px] text-gray-500">Fatigue</div>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2">
          ${['legs', 'cardio', 'upper', 'core'].map(g => {
            const pct = Math.round(recovery.fatigue[g] * 100);
            const icons = { legs: '🦵', cardio: '❤️', upper: '💪', core: '🎯' };
            const barColor = pct > 70 ? 'bg-red-400' : pct > 40 ? 'bg-yellow-400' : 'bg-green-400';
            return `<div class="text-center">
              <span class="text-xs">${icons[g]}</span>
              <div class="w-full h-1.5 bg-hyrox-dark rounded-full mt-1 overflow-hidden">
                <div class="${barColor} h-full rounded-full" style="width:${pct}%"></div>
              </div>
              <div class="text-[9px] text-gray-500 mt-0.5">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  // Wearable data card
  let wearableCardHtml = '';
  if (wearableData) {
    wearableCardHtml = `
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-semibold uppercase tracking-wider text-gray-400">Wearable Data</div>
          <span class="text-[9px] text-gray-500">${wearableData.deviceLabel}</span>
        </div>

        <!-- HR Zones -->
        <div class="mb-3">
          <div class="text-[10px] text-gray-400 mb-1.5">Heart Rate Zones</div>
          <div class="flex h-3 rounded-full overflow-hidden mb-1">
            ${wearableData.hrZones.map(z => `<div class="${z.color}" style="width:${z.pct}%" title="${z.label}: ${z.pct}%"></div>`).join('')}
          </div>
          <div class="flex justify-between">
            ${wearableData.hrZones.map(z => `<span class="text-[8px] ${z.textColor}">${z.label} ${z.pct}%</span>`).join('')}
          </div>
        </div>

        <!-- Key metrics -->
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center">
            <div class="text-sm font-bold text-red-400">${wearableData.avgHR}</div>
            <div class="text-[9px] text-gray-500">Avg HR</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-red-300">${wearableData.maxHR}</div>
            <div class="text-[9px] text-gray-500">Max HR</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-orange-400">${wearableData.calories}</div>
            <div class="text-[9px] text-gray-500">Calories</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-blue-400">${wearableData.trainingEffect || '—'}</div>
            <div class="text-[9px] text-gray-500">T. Effect</div>
          </div>
        </div>
      </div>`;
  }

  // Training load sparkline (last 7 sessions)
  let loadSparkHtml = '';
  if (history.length > 1) {
    const recent = history.slice(0, 7).reverse();
    const maxDur = Math.max(...recent.map(h => h.totalSeconds));
    loadSparkHtml = `
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4">
        <div class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Recent Training Load</div>
        <div class="flex items-end gap-1 h-16">
          ${recent.map((h, i) => {
            const pct = maxDur > 0 ? (h.totalSeconds / maxDur * 100) : 10;
            const isLatest = i === recent.length - 1;
            const typeColors = { stations: 'bg-red-400', run: 'bg-blue-400', sim: 'bg-hyrox-yellow', strength: 'bg-purple-400' };
            const bgColor = typeColors[h.type] || 'bg-gray-400';
            const d = new Date(h.date);
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
            return `<div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full ${bgColor} ${isLatest ? 'opacity-100' : 'opacity-60'} rounded-t transition-all" style="height:${Math.max(8, pct)}%"></div>
              <span class="text-[8px] ${isLatest ? 'text-white font-bold' : 'text-gray-500'}">${dayLabel}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="flex justify-between mt-2 text-[9px] text-gray-500">
          <span>${recent.length} sessions</span>
          <span>Total: ${Math.round(recent.reduce((s, h) => s + h.totalSeconds, 0) / 60)} min</span>
        </div>
      </div>`;
  }

  // Build the full analysis screen
  const card = document.getElementById('exercise-card');
  card.className = 'rounded-2xl mb-4'; // Remove the border style
  card.innerHTML = `
    <div class="py-4">
      <!-- Celebration header -->
      <div class="text-center mb-5">
        <div class="text-5xl mb-2">🏁</div>
        <div class="text-xl font-extrabold text-hyrox-yellow mb-1">Workout Complete!</div>
        <div class="text-gray-400 text-sm">${activeWorkout ? activeWorkout.name : 'Session'}</div>
      </div>

      <!-- Key stats -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-3 text-center">
          <div class="text-xl font-extrabold text-white">${fmt(totalSeconds)}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Duration</div>
        </div>
        <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-3 text-center">
          <div class="text-xl font-extrabold text-white">${currentExIdx + 1}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Exercises</div>
        </div>
        <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-3 text-center">
          <div class="text-xl font-extrabold text-hyrox-yellow">${wearableData ? wearableData.calories : Math.round(totalMins * 8)}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Est. Cal</div>
        </div>
      </div>

      ${trendHtml}

      <div class="space-y-3 mt-4">
        ${wearableCardHtml}
        ${recoveryImpactHtml}
        ${loadSparkHtml}
      </div>

      <!-- AI coach message -->
      <div class="bg-gradient-to-br from-hyrox-yellow/10 to-hyrox-gray/50 border border-hyrox-yellow/30 rounded-xl p-4 mt-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-hyrox-yellow rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-hyrox-dark font-extrabold text-[10px]">AI</span>
          </div>
          <p class="text-gray-300 text-xs leading-relaxed">${getPostWorkoutCoachMessage(meta, totalMins, recovery)}</p>
        </div>
      </div>

      <button onclick="exitWorkout()" class="w-full mt-5 py-4 bg-hyrox-yellow text-hyrox-dark font-extrabold text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-colors">
        Back to Training Plan
      </button>
    </div>`;

  // Also hide the exercise list
  const listEl = document.getElementById('exercise-list-mini');
  if (listEl) listEl.innerHTML = '';
}

function getPostWorkoutCoachMessage(meta, totalMins, recovery) {
  const messages = [];

  if (meta.type === 'stations') {
    messages.push(
      `Solid station work! ${totalMins} minutes building Hyrox-specific strength.`,
      `Great station session. Consistency here is what separates PB chasers from dreamers.`,
      `${totalMins} min of station grinding done. Your race-day self will thank you.`
    );
  } else if (meta.type === 'run') {
    messages.push(
      `Nice run! ${totalMins} minutes of cardio that directly translates to faster transition times.`,
      `Running is 60% of your Hyrox time. Every session like this shaves seconds on race day.`,
      `${totalMins} min run logged. Keep this consistency and your 1km splits will drop.`
    );
  } else if (meta.type === 'sim') {
    messages.push(
      `Full simulation done! The closest thing to race day. You just built serious mental toughness.`,
      `Sim sessions are gold. ${totalMins} min of race-pace experience you can't get any other way.`,
    );
  } else {
    messages.push(
      `${totalMins} minutes of work in the bank. One step closer to race day.`,
      `Every session counts. You just invested ${totalMins} minutes in your Hyrox goal.`
    );
  }

  let msg = messages[Math.floor(Math.random() * messages.length)];

  if (recovery && recovery.zone.id === 'fatigued') {
    msg += ' Your fatigue is building — make sure to prioritize sleep and nutrition tonight.';
  } else if (recovery && recovery.zone.id === 'fresh') {
    msg += ' You\'re recovering well. Ready to push again tomorrow!';
  }

  return msg;
}

function getPostWorkoutWearableData(meta, totalSeconds) {
  // Check if wearable is connected
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return null;
  const connectedDevice = user.connectedWearables ? Object.keys(user.connectedWearables).find(k => user.connectedWearables[k]) : null;
  if (!connectedDevice) return null;

  const totalMins = totalSeconds / 60;

  // Simulate realistic workout data based on type and duration
  const baseHR = meta.type === 'sim' ? 155 : meta.type === 'run' ? 150 : meta.type === 'stations' ? 140 : 135;
  const hrVariance = 10 + Math.floor(Math.random() * 10);
  const avgHR = baseHR + Math.floor(Math.random() * hrVariance) - hrVariance / 2;
  const maxHR = avgHR + 20 + Math.floor(Math.random() * 15);

  // HR zones distribution based on workout type
  const zones = {
    stations: [5, 15, 35, 35, 10],   // more time in Z3-Z4
    run:      [5, 10, 25, 40, 20],    // more time in Z4-Z5
    sim:      [3, 8, 25, 40, 24],     // heavy Z4-Z5
    strength: [10, 25, 40, 20, 5],    // mostly Z2-Z3
  };
  const zoneDistrib = zones[meta.type] || zones.stations;
  // Add some random variance
  const hrZones = [
    { label: 'Z1', pct: Math.max(2, zoneDistrib[0] + Math.floor(Math.random() * 6 - 3)), color: 'bg-gray-400', textColor: 'text-gray-400' },
    { label: 'Z2', pct: Math.max(5, zoneDistrib[1] + Math.floor(Math.random() * 6 - 3)), color: 'bg-blue-400', textColor: 'text-blue-400' },
    { label: 'Z3', pct: Math.max(10, zoneDistrib[2] + Math.floor(Math.random() * 8 - 4)), color: 'bg-green-400', textColor: 'text-green-400' },
    { label: 'Z4', pct: Math.max(10, zoneDistrib[3] + Math.floor(Math.random() * 8 - 4)), color: 'bg-orange-400', textColor: 'text-orange-400' },
    { label: 'Z5', pct: 0, color: 'bg-red-500', textColor: 'text-red-400' },
  ];
  // Make Z5 fill remainder to 100%
  const usedPct = hrZones.slice(0, 4).reduce((s, z) => s + z.pct, 0);
  hrZones[4].pct = Math.max(2, 100 - usedPct);

  // Calories estimate
  const calPerMin = meta.type === 'sim' ? 12 : meta.type === 'run' ? 11 : meta.type === 'stations' ? 9 : 8;
  const calories = Math.round(totalMins * calPerMin + Math.random() * 30);

  // Training effect (Garmin-style 1.0-5.0)
  const teBase = meta.type === 'sim' ? 4.0 : meta.type === 'run' ? 3.5 : 3.0;
  const trainingEffect = (teBase + Math.random() * 0.8 - 0.4).toFixed(1);

  const deviceLabels = {
    garmin: 'Garmin', whoop: 'WHOOP', oura: 'Oura', luna: 'Luna', apple_health: 'Apple Health'
  };

  return {
    device: connectedDevice,
    deviceLabel: deviceLabels[connectedDevice] || connectedDevice,
    avgHR,
    maxHR,
    hrZones,
    calories,
    trainingEffect,
  };
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
  // Check if user is logged in
  const user = getCurrentUser();
  if (user) {
    if (!isOnboarded()) {
      // Logged in but hasn't completed onboarding
      startOnboarding();
    } else {
      enterApp();
      checkGarminCallback();
    }
  } else {
    showLoginScreen();
  }

  syncUIFromState();
  recalculate();
  renderChecklist();
  renderStrategyTips();
  renderNutrition();
  loadFilters(); // Auto-load filter options for Import PB tab
});
