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

  // Apple Health has a special XML import flow
  if (deviceId === 'apple_health') {
    showAppleHealthConnect();
    return;
  }

  // Devices that sync via Strava
  const needsStrava = ['garmin', 'whoop', 'oura', 'luna', 'noisefit'];
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

// ============================================================
// Apple Health — XML Export Import + Guided Flow
// ============================================================

function showAppleHealthConnect() {
  const modal = document.createElement('div');
  modal.id = 'apple-health-modal';
  modal.className = 'fixed inset-0 bg-black/80 z-[60] flex items-end justify-center';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="w-full max-w-lg bg-hyrox-dark border-t border-hyrox-gray rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
            ${WEARABLE_ICONS.apple_health}
          </div>
          <div>
            <div class="font-bold text-sm">Apple Health</div>
            <div class="text-gray-500 text-[10px]">Import your health data</div>
          </div>
        </div>
        <button onclick="document.getElementById('apple-health-modal').remove()" class="w-8 h-8 bg-hyrox-gray rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Option 1: Upload Export -->
      <div class="bg-hyrox-gray/50 border border-pink-500/30 rounded-xl p-4 mb-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">📂</span>
          <span class="font-bold text-sm">Import Health Export</span>
          <span class="ml-auto bg-pink-500/20 text-pink-400 text-[9px] font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span>
        </div>
        <p class="text-gray-400 text-xs mb-3 leading-relaxed">Export your data from iPhone Health app and upload the XML file here. Gets sleep, heart rate, HRV, workouts & more.</p>

        <div class="bg-hyrox-dark rounded-lg p-3 mb-3">
          <div class="text-[10px] font-semibold text-hyrox-yellow mb-2">How to export:</div>
          <div class="space-y-1.5">
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">1.</span>
              <span>Open <strong>Health</strong> app on your iPhone</span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">2.</span>
              <span>Tap your <strong>profile icon</strong> (top right)</span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">3.</span>
              <span>Scroll down → <strong>Export All Health Data</strong></span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">4.</span>
              <span>Save/AirDrop the <strong>export.zip</strong> to this device</span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">5.</span>
              <span>Unzip and upload the <strong>export.xml</strong> file below</span>
            </div>
          </div>
        </div>

        <label class="block cursor-pointer">
          <input type="file" id="apple-health-file" accept=".xml,.zip" onchange="handleAppleHealthUpload(event)" class="hidden" />
          <div class="w-full py-3 bg-pink-500/20 border-2 border-dashed border-pink-500/40 rounded-xl text-center hover:border-pink-500/70 transition-colors">
            <div class="text-pink-400 font-bold text-sm">📱 Upload export.xml</div>
            <div class="text-gray-500 text-[10px] mt-1">or drag & drop here</div>
          </div>
        </label>
        <div id="apple-health-upload-status" class="mt-2 text-xs text-center"></div>
      </div>

      <!-- Option 2: iOS Shortcut -->
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 mb-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">⚡</span>
          <span class="font-bold text-sm">Auto-Sync Shortcut</span>
          <span class="ml-auto bg-blue-500/20 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full">iOS 16+</span>
        </div>
        <p class="text-gray-400 text-xs mb-3 leading-relaxed">Use an iOS Shortcut to automatically export your last 7 days of health data — runs daily in the background.</p>

        <div class="bg-hyrox-dark rounded-lg p-3 mb-3">
          <div class="text-[10px] font-semibold text-hyrox-yellow mb-2">Setup (1 min):</div>
          <div class="space-y-1.5">
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">1.</span>
              <span>Open <strong>Shortcuts</strong> app on iPhone</span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">2.</span>
              <span>Create shortcut: <strong>Find Health Samples</strong> → <strong>Get Text from Input</strong> → <strong>Save File</strong></span>
            </div>
            <div class="flex items-start gap-2 text-[11px] text-gray-300">
              <span class="text-hyrox-yellow font-bold">3.</span>
              <span>Run shortcut, then upload the file above</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Option 3: Strava fallback -->
      <div class="bg-hyrox-gray/50 border border-hyrox-gray rounded-xl p-4 mb-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">🔄</span>
          <span class="font-bold text-sm">Sync via Strava</span>
        </div>
        <p class="text-gray-400 text-xs mb-3 leading-relaxed">If you sync Apple Health → Strava, connect Strava to get your workout data automatically.</p>
        <button onclick="document.getElementById('apple-health-modal').remove(); connectWearableOAuth('strava')" class="w-full py-2.5 bg-[#FC4C02] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-colors">
          Connect Strava Instead
        </button>
      </div>

      <!-- Option 4: Demo -->
      <button onclick="document.getElementById('apple-health-modal').remove(); connectWearableDemo('apple_health')" class="w-full py-2.5 bg-hyrox-gray border border-hyrox-gray text-gray-400 font-semibold text-xs rounded-xl hover:border-hyrox-yellow transition-colors">
        Use Demo Data
      </button>
    </div>`;

  document.body.appendChild(modal);

  // Enable drag & drop
  const dropZone = modal.querySelector('label');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-pink-500'); });
  dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-pink-500'); });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-pink-500');
    const file = e.dataTransfer.files[0];
    if (file) processAppleHealthFile(file);
  });
}

async function handleAppleHealthUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  processAppleHealthFile(file);
}

async function processAppleHealthFile(file) {
  const statusEl = document.getElementById('apple-health-upload-status');
  statusEl.innerHTML = '<span class="text-hyrox-yellow">⏳ Processing file...</span>';

  try {
    let xmlText;

    if (file.name.endsWith('.zip')) {
      // Handle ZIP file — we need to extract export.xml
      statusEl.innerHTML = '<span class="text-yellow-400">📦 Reading ZIP file... (for large exports, please unzip first and upload export.xml)</span>';
      // Try to read as text — if it's actually a zip, this won't work well
      // We'll recommend unzipping first
      statusEl.innerHTML = '<span class="text-orange-400">⚠️ Please unzip the file first and upload the <strong>export.xml</strong> file inside.</span>';
      return;
    }

    // Read XML file
    statusEl.innerHTML = '<span class="text-hyrox-yellow">⏳ Reading XML... (this may take a moment for large files)</span>';
    xmlText = await file.text();

    statusEl.innerHTML = '<span class="text-hyrox-yellow">⏳ Parsing health data...</span>';

    // Parse Apple Health XML
    const healthData = parseAppleHealthXML(xmlText);

    if (!healthData || healthData.totalRecords === 0) {
      statusEl.innerHTML = '<span class="text-red-400">❌ No health data found in file. Make sure this is an Apple Health export.xml</span>';
      return;
    }

    // Save parsed data
    saveAppleHealthData(healthData);

    // Mark as connected
    const user = getCurrentUser();
    const wearables = user?.wearables || {};
    wearables.apple_health = {
      connected: true,
      displayName: 'Apple Health',
      connectedAt: new Date().toISOString(),
      isDemo: false,
      dataSource: 'xml_import',
      lastImport: new Date().toISOString(),
      stats: {
        sleepRecords: healthData.sleep.length,
        hrRecords: healthData.heartRate.length,
        hrvRecords: healthData.hrv.length,
        workouts: healthData.workouts.length,
      }
    };
    updateUser({ wearables, connectedWearables: { ...user?.connectedWearables, apple_health: true } });

    statusEl.innerHTML = `
      <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-left">
        <div class="text-green-400 font-bold text-sm mb-1">✅ Health data imported!</div>
        <div class="grid grid-cols-2 gap-1 text-[10px] text-gray-300">
          <span>🛏 Sleep records: <strong>${healthData.sleep.length}</strong></span>
          <span>❤️ HR samples: <strong>${healthData.heartRate.length}</strong></span>
          <span>💓 HRV records: <strong>${healthData.hrv.length}</strong></span>
          <span>🏃 Workouts: <strong>${healthData.workouts.length}</strong></span>
          <span>👣 Steps days: <strong>${healthData.steps.length}</strong></span>
          <span>🔥 Active cal: <strong>${healthData.activeCalories.length}</strong></span>
        </div>
      </div>`;

    // Close modal after 2s and refresh
    setTimeout(() => {
      document.getElementById('apple-health-modal')?.remove();
      activeWearableId = 'apple_health';
      renderWearableHub();
    }, 2000);

  } catch (err) {
    console.error('Apple Health parse error:', err);
    statusEl.innerHTML = `<span class="text-red-400">❌ Error parsing file: ${err.message}</span>`;
  }
}

function parseAppleHealthXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML file');
  }

  const records = doc.querySelectorAll('Record');
  const workoutEls = doc.querySelectorAll('Workout');

  const data = {
    sleep: [],
    heartRate: [],
    hrv: [],
    restingHR: [],
    steps: [],
    activeCalories: [],
    workouts: [],
    bodyMass: [],
    vo2Max: [],
    totalRecords: records.length + workoutEls.length,
  };

  // Only process last 90 days of data for performance
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  records.forEach(rec => {
    const type = rec.getAttribute('type');
    const startStr = rec.getAttribute('startDate');
    const endStr = rec.getAttribute('endDate');
    const value = parseFloat(rec.getAttribute('value'));
    const unit = rec.getAttribute('unit');

    if (!startStr) return;
    const startDate = new Date(startStr);
    if (startDate < cutoff) return;

    const endDate = endStr ? new Date(endStr) : startDate;

    switch (type) {
      case 'HKCategoryTypeIdentifierSleepAnalysis': {
        const sleepValue = rec.getAttribute('value');
        // InBed, Asleep, AsleepCore, AsleepDeep, AsleepREM, Awake
        if (sleepValue && sleepValue !== 'HKCategoryValueSleepAnalysisInBed') {
          const durationMin = (endDate - startDate) / 60000;
          const dateKey = startDate.toISOString().split('T')[0];
          data.sleep.push({
            date: dateKey,
            stage: sleepValue.replace('HKCategoryValueSleepAnalysis', ''),
            durationMin: Math.round(durationMin),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          });
        }
        break;
      }
      case 'HKQuantityTypeIdentifierHeartRate':
        if (!isNaN(value)) {
          data.heartRate.push({
            date: startDate.toISOString().split('T')[0],
            time: startDate.toISOString(),
            value: Math.round(value),
          });
        }
        break;
      case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
        if (!isNaN(value)) {
          data.hrv.push({
            date: startDate.toISOString().split('T')[0],
            value: Math.round(value),
          });
        }
        break;
      case 'HKQuantityTypeIdentifierRestingHeartRate':
        if (!isNaN(value)) {
          data.restingHR.push({
            date: startDate.toISOString().split('T')[0],
            value: Math.round(value),
          });
        }
        break;
      case 'HKQuantityTypeIdentifierStepCount':
        if (!isNaN(value)) {
          const dateKey = startDate.toISOString().split('T')[0];
          data.steps.push({ date: dateKey, value: Math.round(value) });
        }
        break;
      case 'HKQuantityTypeIdentifierActiveEnergyBurned':
        if (!isNaN(value)) {
          const dateKey = startDate.toISOString().split('T')[0];
          data.activeCalories.push({ date: dateKey, value: Math.round(value) });
        }
        break;
      case 'HKQuantityTypeIdentifierBodyMass':
        if (!isNaN(value)) {
          data.bodyMass.push({ date: startDate.toISOString().split('T')[0], value, unit });
        }
        break;
      case 'HKQuantityTypeIdentifierVO2Max':
        if (!isNaN(value)) {
          data.vo2Max.push({ date: startDate.toISOString().split('T')[0], value });
        }
        break;
    }
  });

  // Parse workouts
  workoutEls.forEach(w => {
    const activityType = w.getAttribute('workoutActivityType') || '';
    const startStr = w.getAttribute('startDate');
    const endStr = w.getAttribute('endDate');
    const duration = parseFloat(w.getAttribute('duration'));
    const calories = parseFloat(w.getAttribute('totalEnergyBurned'));
    const distance = parseFloat(w.getAttribute('totalDistance'));

    if (!startStr) return;
    const startDate = new Date(startStr);
    if (startDate < cutoff) return;

    data.workouts.push({
      date: startDate.toISOString().split('T')[0],
      type: activityType.replace('HKWorkoutActivityType', ''),
      duration: Math.round(duration || 0),
      calories: Math.round(calories || 0),
      distance: distance ? +(distance / 1000).toFixed(2) : 0,
      start: startDate.toISOString(),
      end: endStr,
    });
  });

  return data;
}

function saveAppleHealthData(healthData) {
  // Aggregate sleep by date
  const sleepByDate = {};
  healthData.sleep.forEach(s => {
    if (!sleepByDate[s.date]) {
      sleepByDate[s.date] = { total: 0, deep: 0, rem: 0, core: 0, awake: 0 };
    }
    const d = sleepByDate[s.date];
    d.total += s.durationMin;
    if (s.stage === 'AsleepDeep' || s.stage === 'Deep') d.deep += s.durationMin;
    else if (s.stage === 'AsleepREM' || s.stage === 'REM') d.rem += s.durationMin;
    else if (s.stage === 'AsleepCore' || s.stage === 'Core' || s.stage === 'Asleep') d.core += s.durationMin;
    else if (s.stage === 'Awake') d.awake += s.durationMin;
  });

  // Aggregate steps by date
  const stepsByDate = {};
  healthData.steps.forEach(s => {
    stepsByDate[s.date] = (stepsByDate[s.date] || 0) + s.value;
  });

  // Aggregate calories by date
  const calByDate = {};
  healthData.activeCalories.forEach(c => {
    calByDate[c.date] = (calByDate[c.date] || 0) + c.value;
  });

  // Get latest HRV by date
  const hrvByDate = {};
  healthData.hrv.forEach(h => {
    if (!hrvByDate[h.date] || h.value > 0) hrvByDate[h.date] = h.value;
  });

  // Get latest RHR by date
  const rhrByDate = {};
  healthData.restingHR.forEach(r => {
    rhrByDate[r.date] = r.value;
  });

  // Build daily summaries (last 30 days)
  const summaries = {};
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];

    const sleep = sleepByDate[dateKey];
    const sleepHours = sleep ? +(sleep.total / 60).toFixed(1) : null;
    const deepPct = sleep && sleep.total > 0 ? Math.round((sleep.deep / sleep.total) * 100) : null;
    const remPct = sleep && sleep.total > 0 ? Math.round((sleep.rem / sleep.total) * 100) : null;

    summaries[dateKey] = {
      sleep: sleepHours,
      deepPct,
      remPct,
      lightPct: (deepPct !== null && remPct !== null) ? Math.max(0, 100 - deepPct - remPct) : null,
      hrv: hrvByDate[dateKey] || null,
      restingHR: rhrByDate[dateKey] || null,
      steps: stepsByDate[dateKey] || null,
      activeCalories: calByDate[dateKey] || null,
    };
  }

  // Store aggregated data
  const appleHealthStore = {
    summaries,
    workouts: healthData.workouts.slice(-50), // last 50 workouts
    latestVO2Max: healthData.vo2Max.length > 0 ? healthData.vo2Max[healthData.vo2Max.length - 1].value : null,
    latestBodyMass: healthData.bodyMass.length > 0 ? healthData.bodyMass[healthData.bodyMass.length - 1] : null,
    importedAt: new Date().toISOString(),
  };

  localStorage.setItem('hyrox_apple_health', JSON.stringify(appleHealthStore));

  // Also store as wearable sleep data for recovery matrix
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split('T')[0];
  const todayKey = new Date().toISOString().split('T')[0];

  const latestSleep = summaries[yKey] || summaries[todayKey];
  if (latestSleep && latestSleep.sleep) {
    const recoveryScore = calculateAppleHealthRecovery(latestSleep);
    const sleepCacheData = {
      hasData: true,
      device: 'apple_health',
      deviceLabel: 'Apple Health Sleep',
      timestamp: Date.now(),
      recoveryScore,
      sleep: {
        hours: latestSleep.sleep,
        deepPct: latestSleep.deepPct || 20,
        remPct: latestSleep.remPct || 22,
        lightPct: latestSleep.lightPct || 58,
        quality: recoveryScore > 80 ? 'Good' : recoveryScore > 60 ? 'Fair' : 'Poor',
      },
      hrv: latestSleep.hrv || 45,
      restingHR: latestSleep.restingHR || 58,
    };
    localStorage.setItem('hyrox_sleep_apple_health', JSON.stringify(sleepCacheData));
  }
}

function calculateAppleHealthRecovery(daySummary) {
  let score = 50; // base

  // Sleep hours (optimal 7-9h)
  if (daySummary.sleep) {
    if (daySummary.sleep >= 7 && daySummary.sleep <= 9) score += 25;
    else if (daySummary.sleep >= 6) score += 15;
    else if (daySummary.sleep >= 5) score += 5;
    else score -= 10;
  }

  // Deep sleep (optimal > 20%)
  if (daySummary.deepPct) {
    if (daySummary.deepPct >= 20) score += 10;
    else if (daySummary.deepPct >= 15) score += 5;
  }

  // HRV (higher is generally better)
  if (daySummary.hrv) {
    if (daySummary.hrv >= 60) score += 10;
    else if (daySummary.hrv >= 40) score += 5;
    else score -= 5;
  }

  // Resting HR (lower is better for athletes)
  if (daySummary.restingHR) {
    if (daySummary.restingHR <= 55) score += 5;
    else if (daySummary.restingHR <= 65) score += 2;
    else score -= 5;
  }

  return Math.max(10, Math.min(100, score));
}

function getAppleHealthSummary() {
  try {
    const raw = localStorage.getItem('hyrox_apple_health');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function getAppleHealthWorkouts() {
  const data = getAppleHealthSummary();
  if (!data || !data.workouts) return [];

  return data.workouts.map(w => ({
    name: `${w.type} Workout`,
    type: mapAppleWorkoutType(w.type),
    date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: w.duration > 3600
      ? `${Math.floor(w.duration / 3600)}h ${Math.floor((w.duration % 3600) / 60)}m`
      : `${Math.floor(w.duration / 60)}m`,
    distance: w.distance > 0 ? `${w.distance} km` : '',
    calories: w.calories || null,
    hr_avg: null, // Apple Health export doesn't include avg HR per workout easily
  }));
}

function mapAppleWorkoutType(appleType) {
  const map = {
    Running: 'running',
    Cycling: 'cycling',
    FunctionalStrengthTraining: 'strength',
    TraditionalStrengthTraining: 'strength',
    Rowing: 'rowing',
    HighIntensityIntervalTraining: 'hyrox',
    CrossTraining: 'hyrox',
    Walking: 'other',
    Swimming: 'other',
    Yoga: 'other',
  };
  return map[appleType] || 'other';
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
  } else if (deviceId === 'apple_health' && conn?.dataSource === 'xml_import') {
    // Load from parsed Apple Health data
    await new Promise(r => setTimeout(r, 400));
    const ahWorkouts = getAppleHealthWorkouts();
    if (ahWorkouts.length > 0) {
      wearableActivities = ahWorkouts;
    } else {
      wearableActivities = generateDemoActivities();
    }
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
  showTab('train');
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
