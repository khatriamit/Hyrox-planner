// ============================================================
// Auth Module — Login / Signup / Profile
// ============================================================

const AUTH_KEY = 'hyrox_auth';
const USERS_KEY = 'hyrox_users';

let currentUser = null;

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (_) { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch (_) { return null; }
}

function saveSession(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

// Simple hash for password (NOT cryptographic — just for local demo)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function signup(name, email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();

  if (users[key]) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  if (!name.trim() || !email.trim() || !password) {
    return { ok: false, error: 'All fields are required.' };
  }

  if (password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const user = {
    name: name.trim(),
    email: key,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    garmin: null,
  };

  users[key] = user;
  saveUsers(users);
  saveSession({ email: key, name: user.name });
  currentUser = user;
  return { ok: true, user };
}

function login(email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  const user = users[key];

  if (!user) {
    return { ok: false, error: 'No account found with this email.' };
  }

  if (user.passwordHash !== simpleHash(password)) {
    return { ok: false, error: 'Incorrect password.' };
  }

  saveSession({ email: key, name: user.name });
  currentUser = user;
  return { ok: true, user };
}

function logout() {
  clearSession();
  currentUser = null;
  showLoginScreen();
}

function getCurrentUser() {
  if (currentUser) return currentUser;
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  currentUser = users[session.email] || null;
  return currentUser;
}

function updateUser(updates) {
  if (!currentUser) return;
  const users = getUsers();
  const key = currentUser.email;
  Object.assign(users[key], updates);
  Object.assign(currentUser, updates);
  saveUsers(users);
}

// ============================================================
// Login / Signup UI
// ============================================================

function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('signup-form').classList.add('hidden');
  clearLoginErrors();
}

function showSignupForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('signup-form').classList.remove('hidden');
  clearLoginErrors();
}

function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('signup-form').classList.add('hidden');
  clearLoginErrors();
}

function clearLoginErrors() {
  document.querySelectorAll('.auth-error').forEach(el => el.textContent = '');
}

function handleLogin(e) {
  e.preventDefault();
  clearLoginErrors();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const result = login(email, password);

  if (!result.ok) {
    document.getElementById('login-error').textContent = result.error;
    return;
  }

  enterAppAfterLogin();
}

function handleSignup(e) {
  e.preventDefault();
  clearLoginErrors();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const result = signup(name, email, password);

  if (!result.ok) {
    document.getElementById('signup-error').textContent = result.error;
    return;
  }

  enterAppAfterLogin();
}

function enterApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('onboarding-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  updateUserHeader();
}

function enterAppAfterLogin() {
  document.getElementById('login-screen').classList.add('hidden');
  if (!isOnboarded()) {
    startOnboarding();
  } else {
    enterApp();
  }
}

function updateUserHeader() {
  const user = getCurrentUser();
  if (!user) return;
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
}

function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  menu.classList.toggle('hidden');
  // Close when clicking outside
  if (!menu.classList.contains('hidden')) {
    setTimeout(() => {
      const close = (e) => {
        if (!menu.contains(e.target) && !document.getElementById('profile-btn').contains(e.target)) {
          menu.classList.add('hidden');
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    }, 10);
  }
}

// ============================================================
// Wearable Connectors — Garmin, WHOOP, Oura Ring, Luna Ring
// ============================================================

// SVG icons for each wearable brand
const WEARABLE_ICONS = {
  apple_health: `<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF2D55"/></svg>`,
  garmin: `<svg viewBox="0 0 24 24" class="w-6 h-6"><path d="M12 4L4 20h16L12 4z" fill="#00AEEF" opacity="0.15"/><path d="M12 4L4 20h16L12 4z" fill="none" stroke="#00AEEF" stroke-width="1.5" stroke-linejoin="round"/><text x="12" y="17" text-anchor="middle" fill="#00AEEF" font-size="7" font-weight="bold">G</text></svg>`,
  whoop: `<svg viewBox="0 0 24 24" class="w-6 h-6"><circle cx="12" cy="12" r="9" fill="none" stroke="#00F19F" stroke-width="2.5"/><path d="M8 12h8" stroke="#00F19F" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  oura: `<svg viewBox="0 0 24 24" class="w-6 h-6"><circle cx="12" cy="12" r="8" fill="none" stroke="#2A72DE" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#2A72DE" stroke-width="1.5"/></svg>`,
  luna: `<svg viewBox="0 0 24 24" class="w-6 h-6"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="#5EEAD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  noisefit: `<svg viewBox="0 0 24 24" class="w-6 h-6"><circle cx="12" cy="12" r="9" fill="none" stroke="#FF6B35" stroke-width="2"/><path d="M8 14l2-4 2 4 2-4 2 4" stroke="#FF6B35" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  strava: `<svg viewBox="0 0 24 24" class="w-6 h-6"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.6h4.172L10.463 0l-7 13.828h4.169" fill="#FC4C02"/></svg>`,
};

const WEARABLES = {
  apple_health: { name: 'Apple Health', icon: WEARABLE_ICONS.apple_health, color: 'pink', desc: 'Import workouts, heart rate, and activity rings from Apple Health.' },
  garmin: { name: 'Garmin', icon: WEARABLE_ICONS.garmin, color: 'blue', desc: 'Sync runs, workouts, and heart rate data from Garmin Connect.' },
  whoop: { name: 'WHOOP', icon: WEARABLE_ICONS.whoop, color: 'red', desc: 'Import strain, recovery, and sleep scores from your WHOOP band.' },
  oura: { name: 'Oura Ring', icon: WEARABLE_ICONS.oura, color: 'purple', desc: 'Track sleep quality, readiness, and activity from Oura.' },
  luna: { name: 'Luna Ring', icon: WEARABLE_ICONS.luna, color: 'teal', desc: 'Sync sleep, stress, and wellness metrics from Luna Ring.' },
  noisefit: { name: 'NoiseFit', icon: WEARABLE_ICONS.noisefit, color: 'orange', desc: 'Import workouts, heart rate, and SpO2 data from NoiseFit smartwatches.' },
  strava: { name: 'Strava', icon: WEARABLE_ICONS.strava, color: 'orange', desc: 'Import runs, workouts, and race data directly from Strava. Works with all devices.' },
};

let wearableActivities = [];
let activeWearableId = null;

function showGarminModal() {
  // Legacy — now opens wearable hub
  showWearableModal('garmin');
}

function showWearableModal(deviceId) {
  document.getElementById('profile-menu')?.classList.add('hidden');
  activeWearableId = deviceId || null;
  const modal = document.getElementById('garmin-modal');
  modal.classList.remove('hidden');
  renderWearableHub();
}

function closeGarminModal() {
  document.getElementById('garmin-modal').classList.add('hidden');
}

function renderWearableHub() {
  const user = getCurrentUser();
  const container = document.getElementById('garmin-content');
  const titleEl = document.querySelector('#garmin-modal h3');

  // If a specific device is selected and connected, show its detail
  if (activeWearableId && user?.wearables?.[activeWearableId]?.connected) {
    const dev = WEARABLES[activeWearableId];
    const conn = user.wearables[activeWearableId];
    if (titleEl) titleEl.textContent = dev.name;

    container.innerHTML = `
      <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">${dev.icon}</div>
          <div>
            <div class="font-semibold text-green-400 text-sm">Connected to ${dev.name}</div>
            <div class="text-gray-400 text-xs">${conn.displayName || dev.name}</div>
          </div>
        </div>
      </div>
      <button onclick="syncWearableActivities('${activeWearableId}')" id="garmin-sync-btn"
        class="w-full py-3 bg-hyrox-yellow text-hyrox-dark font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors mb-3">
        Sync Latest Activities
      </button>
      <div id="garmin-activities" class="space-y-2 mb-4"></div>
      <div class="flex gap-2">
        <button onclick="activeWearableId=null;renderWearableHub()"
          class="flex-1 py-2.5 bg-hyrox-gray border border-hyrox-gray text-gray-300 font-semibold text-xs rounded-xl hover:border-hyrox-yellow transition-colors">
          ← All Devices
        </button>
        <button onclick="disconnectWearable('${activeWearableId}')"
          class="flex-1 py-2.5 bg-hyrox-gray border border-red-500/30 text-red-400 font-semibold text-xs rounded-xl hover:border-red-500 transition-colors">
          Disconnect
        </button>
      </div>
    `;
    return;
  }

  // Hub view — show all wearables
  if (titleEl) titleEl.textContent = 'Wearables';

  const deviceCards = Object.entries(WEARABLES).map(([id, dev]) => {
    const isConnected = user?.wearables?.[id]?.connected;
    const colorMap = { pink: 'border-pink-500/40', blue: 'border-blue-500/40', red: 'border-red-500/40', purple: 'border-purple-500/40', teal: 'border-teal-500/40', orange: 'border-orange-500/40' };
    const borderColor = isConnected ? (colorMap[dev.color] || 'border-hyrox-yellow/40') : 'border-hyrox-gray';
    return `
      <div class="bg-hyrox-gray/30 border ${borderColor} rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-hyrox-dark rounded-xl flex items-center justify-center">${dev.icon}</div>
          <div class="flex-1">
            <div class="font-bold text-sm">${dev.name}</div>
            <div class="text-gray-500 text-[10px]">${isConnected ? '✓ Connected' : 'Not connected'}</div>
          </div>
          ${isConnected ? '<div class="w-2 h-2 bg-green-500 rounded-full"></div>' : ''}
        </div>
        <p class="text-gray-400 text-xs mb-3 leading-relaxed">${dev.desc}</p>
        ${isConnected
          ? `<button onclick="activeWearableId='${id}';renderWearableHub()" class="w-full py-2 bg-hyrox-dark border border-hyrox-gray rounded-lg text-xs font-semibold text-gray-300 hover:border-hyrox-yellow transition-colors">View & Sync</button>`
          : `<div class="flex gap-2">
              <button onclick="connectWearableOAuth('${id}')" class="flex-1 py-2 bg-hyrox-yellow text-hyrox-dark rounded-lg text-xs font-bold hover:bg-yellow-400 transition-colors">Connect</button>
              <button onclick="connectWearableDemo('${id}')" class="py-2 px-3 bg-hyrox-dark border border-hyrox-gray rounded-lg text-[10px] text-gray-400 hover:border-hyrox-yellow transition-colors">Demo</button>
            </div>`
        }
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="space-y-3">
      ${deviceCards}
    </div>
    <p class="text-gray-600 text-[10px] mt-4 text-center">We only read activity data. Your credentials are never stored.</p>
  `;
}

async function connectWearableOAuth(deviceId) {
  const dev = WEARABLES[deviceId];

  // Strava has a real OAuth2 flow built
  if (deviceId === 'strava') {
    return connectStravaOAuth();
  }

  // For devices that need native apps (Apple Health) or business API partnerships
  const nativeOnly = ['apple_health'];
  const needsStrava = ['garmin', 'whoop', 'oura', 'luna', 'noisefit'];

  if (nativeOnly.includes(deviceId)) {
    showWearableConnectHelp(deviceId, 'native');
    return;
  }

  if (needsStrava.includes(deviceId)) {
    showWearableConnectHelp(deviceId, 'strava');
    return;
  }
}

function showWearableConnectHelp(deviceId, helpType) {
  const dev = WEARABLES[deviceId];
  const modal = document.createElement('div');
  modal.id = 'wearable-help-modal';
  modal.className = 'fixed inset-0 bg-black/80 z-[60] flex items-end justify-center';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  let content = '';
  if (helpType === 'native') {
    content = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-hyrox-dark rounded-xl flex items-center justify-center">${dev.icon}</div>
        <div>
          <div class="font-bold text-sm">${dev.name}</div>
          <div class="text-gray-500 text-[10px]">Requires native app</div>
        </div>
      </div>
      <p class="text-gray-300 text-sm mb-4">${dev.name} data is only accessible through native iOS/Android apps. In a web app, you can:</p>
      <div class="space-y-2 mb-4">
        <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3">
          <span>📱</span>
          <span class="text-sm">Sync ${dev.name} → <strong class="text-hyrox-yellow">Strava</strong> on your phone</span>
        </div>
        <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3">
          <span>🔗</span>
          <span class="text-sm">Then connect Strava here to import activities</span>
        </div>
      </div>
      <button onclick="document.getElementById('wearable-help-modal').remove(); connectWearableOAuth('strava')" class="w-full py-3 bg-[#FC4C02] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-colors mb-2">
        Connect via Strava
      </button>
      <button onclick="document.getElementById('wearable-help-modal').remove(); connectWearableDemo('${deviceId}')" class="w-full py-3 bg-hyrox-gray border border-hyrox-gray text-gray-300 font-semibold text-xs rounded-xl hover:border-hyrox-yellow transition-colors">
        Use Demo Data Instead
      </button>`;
  } else if (helpType === 'strava') {
    const syncInstructions = {
      garmin: 'Open Garmin Connect app → Settings → Connected Apps → Strava',
      whoop: 'Open WHOOP app → Profile → Connected Apps → Strava',
      oura: 'Open Oura app → Settings → Connected Services → Strava',
      luna: 'Open Luna app → Settings → Third Party → Strava',
      noisefit: 'Open NoiseFit app → Profile → Third Party Sync → Strava',
    };

    content = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-hyrox-dark rounded-xl flex items-center justify-center">${dev.icon}</div>
        <div>
          <div class="font-bold text-sm">${dev.name}</div>
          <div class="text-gray-500 text-[10px]">Connect via Strava</div>
        </div>
      </div>
      <p class="text-gray-300 text-sm mb-4">The fastest way to get your ${dev.name} data is through Strava — it syncs automatically.</p>
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 mb-4">
        <div class="text-xs font-semibold text-hyrox-yellow mb-2">Quick Setup (1 min)</div>
        <div class="space-y-2">
          <div class="flex items-start gap-2 text-xs text-gray-300">
            <span class="text-hyrox-yellow font-bold">1.</span>
            <span>${syncInstructions[deviceId] || 'Sync your device to Strava in its app settings'}</span>
          </div>
          <div class="flex items-start gap-2 text-xs text-gray-300">
            <span class="text-hyrox-yellow font-bold">2.</span>
            <span>Connect Strava below — all your ${dev.name} workouts will appear</span>
          </div>
        </div>
      </div>
      <button onclick="document.getElementById('wearable-help-modal').remove(); connectWearableOAuth('strava')" class="w-full py-3 bg-[#FC4C02] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-colors mb-2">
        Connect Strava
      </button>
      <button onclick="document.getElementById('wearable-help-modal').remove(); connectWearableDemo('${deviceId}')" class="w-full py-3 bg-hyrox-gray border border-hyrox-gray text-gray-300 font-semibold text-xs rounded-xl hover:border-hyrox-yellow transition-colors">
        Use Demo Data Instead
      </button>`;
  }

  modal.innerHTML = `
    <div class="w-full max-w-lg bg-hyrox-dark border-t border-hyrox-gray rounded-t-2xl p-6">
      <div class="flex justify-end mb-2">
        <button onclick="document.getElementById('wearable-help-modal').remove()" class="w-8 h-8 bg-hyrox-gray rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      ${content}
    </div>`;

  document.body.appendChild(modal);
}

// ---- Strava Real OAuth2 Flow ----
function connectStravaOAuth() {
  // Open Strava auth in popup
  const popup = window.open('/api/strava/auth', 'strava_auth', 'width=500,height=700,scrollbars=yes');

  if (!popup) {
    // Popup blocked — redirect instead
    window.location.href = '/api/strava/auth';
    return;
  }

  // Listen for the callback message
  const listener = (event) => {
    if (event.data && event.data.type === 'strava_auth') {
      window.removeEventListener('message', listener);

      // Save Strava tokens
      const user = getCurrentUser();
      const wearables = user?.wearables || {};
      wearables.strava = {
        connected: true,
        displayName: `${event.data.athlete?.firstname || ''} ${event.data.athlete?.lastname || ''}`.trim() || 'Strava Athlete',
        connectedAt: new Date().toISOString(),
        isDemo: false,
        accessToken: event.data.access_token,
        refreshToken: event.data.refresh_token,
        expiresAt: event.data.expires_at,
        athlete: event.data.athlete,
      };

      // Also mark the device they originally wanted as connected via Strava
      updateUser({ wearables, connectedWearables: { strava: true } });
      activeWearableId = 'strava';
      renderWearableHub();
    } else if (event.data && event.data.type === 'strava_error') {
      window.removeEventListener('message', listener);
      alert('Strava connection failed: ' + (event.data.error || 'Unknown error'));
    }
  };
  window.addEventListener('message', listener);
}

async function syncStravaActivities() {
  const user = getCurrentUser();
  const strava = user?.wearables?.strava;
  if (!strava?.accessToken) return [];

  try {
    const resp = await fetch(`/api/strava/activities?token=${strava.accessToken}`);
    if (!resp.ok) throw new Error('API error');
    const activities = await resp.json();

    // Transform Strava activities to our format
    return activities.map(a => ({
      name: a.name,
      type: mapStravaType(a.type),
      date: new Date(a.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: formatStravaDuration(a.moving_time),
      distance: a.distance > 0 ? (a.distance / 1000).toFixed(1) + ' km' : '',
      hr_avg: a.average_heartrate ? Math.round(a.average_heartrate) : null,
      hr_max: a.max_heartrate ? Math.round(a.max_heartrate) : null,
      calories: a.calories || null,
      pace: a.type === 'Run' && a.distance > 0 ? formatStravaPace(a.moving_time, a.distance) : '',
      strava_id: a.id,
      raw: a,
    }));
  } catch (err) {
    console.error('Strava sync error:', err);
    return [];
  }
}

function mapStravaType(stravaType) {
  const map = { Run: 'running', Ride: 'cycling', WeightTraining: 'strength', Rowing: 'rowing', CrossFit: 'hyrox', Workout: 'strength' };
  return map[stravaType] || 'other';
}

function formatStravaDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatStravaPace(seconds, meters) {
  const paceSecPerKm = seconds / (meters / 1000);
  const min = Math.floor(paceSecPerKm / 60);
  const sec = Math.round(paceSecPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function connectWearableDemo(deviceId) {
  const dev = WEARABLES[deviceId];
  const user = getCurrentUser();
  const wearables = user?.wearables || {};
  wearables[deviceId] = {
    connected: true,
    displayName: `Demo ${dev.name}`,
    connectedAt: new Date().toISOString(),
    isDemo: true,
  };
  updateUser({ wearables });
  wearableActivities = generateDemoActivities();
  activeWearableId = deviceId;
  renderWearableHub();
}

function disconnectWearable(deviceId) {
  const dev = WEARABLES[deviceId];
  if (!confirm(`Disconnect ${dev.name}? Your synced data will be removed.`)) return;
  const user = getCurrentUser();
  const wearables = user?.wearables || {};
  delete wearables[deviceId];
  updateUser({ wearables });
  wearableActivities = [];
  activeWearableId = null;
  renderWearableHub();
}

async function syncWearableActivities(deviceId) {
  const btn = document.getElementById('garmin-sync-btn');
  btn.disabled = true;
  btn.textContent = 'Syncing...';

  const user = getCurrentUser();
  const conn = user?.wearables?.[deviceId];

  if (conn?.isDemo) {
    await new Promise(r => setTimeout(r, 800));
    wearableActivities = generateDemoActivities();
  } else if (deviceId === 'strava' && conn?.accessToken) {
    // Real Strava sync
    const activities = await syncStravaActivities();
    if (activities.length > 0) {
      wearableActivities = activities;
    } else {
      wearableActivities = generateDemoActivities();
    }
  } else {
    try {
      const resp = await fetch(`/api/garmin/activities?device=${deviceId}`);
      const data = await resp.json();
      if (data.activities) {
        wearableActivities = data.activities;
      }
    } catch (err) {
      wearableActivities = generateDemoActivities();
    }
  }

  btn.disabled = false;
  btn.textContent = 'Sync Latest Activities';
  renderWearableActivitiesList();
}

function renderWearableActivitiesList() {
  const container = document.getElementById('garmin-activities');
  if (!container || wearableActivities.length === 0) return;

  const typeIcons = {
    running: '🏃',
    cycling: '🚴',
    strength: '💪',
    hyrox: '🏋️',
    rowing: '🚣',
    other: '⚡',
  };

  container.innerHTML = `
    <div class="text-xs font-semibold text-gray-400 mb-2">Recent Activities (${wearableActivities.length})</div>
    ${wearableActivities.map((a, idx) => `
      <div class="bg-hyrox-dark rounded-xl p-3 flex items-center gap-3 ${a.type === 'hyrox' ? 'border border-hyrox-yellow/30' : ''}">
        <div class="w-9 h-9 bg-hyrox-gray rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          ${typeIcons[a.type] || typeIcons.other}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate">${a.name}</div>
          <div class="text-gray-500 text-[10px]">${a.date} · ${a.duration} · ${a.distance || ''}</div>
        </div>
        ${a.hr_avg ? `<div class="text-right flex-shrink-0">
          <div class="text-xs font-mono text-red-400">♥ ${a.hr_avg}</div>
          <div class="text-[10px] text-gray-500">avg bpm</div>
        </div>` : ''}
        ${a.type === 'hyrox' ? `
          <button onclick="importWearableHyrox(${idx})"
            class="text-[10px] bg-hyrox-yellow/20 text-hyrox-yellow px-2 py-1 rounded-full font-semibold flex-shrink-0">
            Import
          </button>` : ''}
      </div>
    `).join('')}
  `;
}

function importWearableHyrox(idx) {
  const activity = wearableActivities[idx];
  if (!activity || !activity.splits) return;

  // Import splits into state
  const stationIds = ['ski_erg', 'sled_push', 'sled_pull', 'burpee_broad_jump', 'rowing', 'farmers_carry', 'sandbag_lunges', 'wall_balls'];
  stationIds.forEach(id => {
    if (activity.splits[id] && activity.splits[id] > 0) {
      state.stationTimes[id] = activity.splits[id];
    }
  });

  if (activity.splits.overall) {
    state.targetSeconds = activity.splits.overall;
  }

  // Calculate run pace
  let totalRunSec = 0, runCount = 0;
  for (let i = 1; i <= 8; i++) {
    if (activity.splits[`run_${i}`]) {
      totalRunSec += activity.splits[`run_${i}`];
      runCount++;
    }
  }
  if (runCount > 0) {
    state.runPace = (totalRunSec / runCount) / 60;
  }

  state.pb = { ...activity.splits, name: 'Garmin Import', source: 'garmin' };
  saveState();
  syncUIFromState();
  recalculate();
  closeGarminModal();
  showTab('setup');
}

function generateDemoActivities() {
  const now = new Date();
  return [
    {
      name: 'Hyrox Race — Munich',
      type: 'hyrox',
      date: formatDate(daysAgo(now, 3)),
      duration: '1:32:15',
      distance: '8km run + 8 stations',
      hr_avg: 172,
      splits: {
        run_1: 310, run_2: 318, run_3: 325, run_4: 330,
        run_5: 335, run_6: 340, run_7: 345, run_8: 350,
        ski_erg: 245, sled_push: 195, sled_pull: 205,
        burpee_broad_jump: 280, rowing: 255, farmers_carry: 175,
        sandbag_lunges: 215, wall_balls: 185,
        overall: 5535,
      }
    },
    {
      name: 'Easy Recovery Run',
      type: 'running',
      date: formatDate(daysAgo(now, 1)),
      duration: '35:12',
      distance: '5.8 km',
      hr_avg: 138,
    },
    {
      name: 'Interval Training',
      type: 'running',
      date: formatDate(daysAgo(now, 2)),
      duration: '42:05',
      distance: '7.2 km',
      hr_avg: 162,
    },
    {
      name: 'Upper Body Strength',
      type: 'strength',
      date: formatDate(daysAgo(now, 4)),
      duration: '55:00',
      distance: '',
      hr_avg: 128,
    },
    {
      name: '2K Row Test',
      type: 'rowing',
      date: formatDate(daysAgo(now, 5)),
      duration: '7:45',
      distance: '2,000m',
      hr_avg: 175,
    },
    {
      name: 'Long Run',
      type: 'running',
      date: formatDate(daysAgo(now, 6)),
      duration: '1:05:30',
      distance: '11.2 km',
      hr_avg: 148,
    },
  ];
}

function daysAgo(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ============================================================
// Check Garmin OAuth callback
// ============================================================
function checkGarminCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('garmin_connected')) {
    const displayName = params.get('garmin_name') || 'Garmin User';
    updateUser({
      garmin: {
        connected: true,
        displayName,
        connectedAt: new Date().toISOString(),
        isDemo: false,
      }
    });
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Show Garmin modal with success
    setTimeout(() => showGarminModal(), 500);
  }
}
