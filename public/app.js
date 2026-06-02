// Master Controller & Shared State Module Hub
const socket = io();

export const AppState = {
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  username: localStorage.getItem('username') || '',
  modules: {} // Holds references to initialized modules
};

document.addEventListener('DOMContentLoaded', () => {
  if (AppState.token) {
    initializeWorkspace();
  } else {
    document.getElementById('login-form').addEventListener('submit', handleLoginRequest);
  }
  document.getElementById('logout-btn').addEventListener('click', terminateSession);
});

async function handleLoginRequest(e) {
  e.preventDefault();
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authorization Rejected.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);

    AppState.token = data.token;
    AppState.role = data.role;
    AppState.username = data.username;

    showToast(`Welcome back, ${data.username}!`, 'success');
    initializeWorkspace();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function terminateSession() {
  localStorage.clear();
  location.reload();
}

// THE MASTER ROUTER: Orchestrates full vs isolated access
async function initializeWorkspace() {
  document.getElementById('auth-gate').classList.add('hidden');
  const shell = document.getElementById('workspace-shell');
  shell.classList.remove('hidden');

  const badge = document.getElementById('user-badge');
  badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span> SYSTEM ROOT: ${AppState.username.toUpperCase()}`;

  const inputTarget = document.getElementById('module-input-target');
  const displayTarget = document.getElementById('module-display-target');

  // Clear previous workspaces out of the DOM view area
  inputTarget.innerHTML = '';
  displayTarget.innerHTML = '';

  if (AppState.role === 'admin') {
    // Modify structure to support multi-column responsive grid view dashboards
    const workspaceContainer = document.querySelector('#workspace-shell > .max-w-7xl');
    workspaceContainer.className = "max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6";
    workspaceContainer.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section id="admin-input-col" class="lg:col-span-1 bg-stone-900 text-white p-6 rounded-2xl shadow-xl h-fit border border-stone-800"></section>
        <section id="admin-display-col" class="lg:col-span-3 bg-stone-950 text-white p-6 rounded-2xl shadow-xl border border-stone-800 h-fit max-h-[400px] overflow-y-auto"></section>
      </div>
      
      <h2 class="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">Operational Command Center (Full View)</h2>
      <div id="master-admin-grid" class="grid grid-cols-1 xl:grid-cols-2 gap-6"></div>
    `;

    // 1. Lazy-Load Root Administration Module First
    const adminModule = await import('./modules/admin.js');
    adminModule.init(document.getElementById('admin-input-col'), document.getElementById('admin-display-col'));
    AppState.modules['admin'] = adminModule;

    // 2. Build grids for operational workflows dynamically
    const adminGrid = document.getElementById('master-admin-grid');
    const operationalApps = ['reception', 'housekeeping', 'maintenance', 'purchasing', 'accounting', 'sales', 'reservations'];

    for (const app of operationalApps) {
      const card = document.createElement('div');
      card.className = "bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4";
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-stone-100 pb-2">
          <h4 class="text-xs font-black uppercase tracking-wider text-stone-400">System App Component: ${app}</h4>
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="${app}-input-slot" class="md:col-span-1"></div>
          <div id="${app}-display-slot" class="md:col-span-2 max-h-[350px] overflow-y-auto pr-1"></div>
        </div>
      `;
      adminGrid.appendChild(card);

      // Dynamically mount sub-components into their allocated slot layout panels
      try {
        const mod = await import(`./modules/${app}.js`);
        mod.init(document.getElementById(`${app}-input-slot`), document.getElementById(`${app}-display-slot`));
        AppState.modules[app] = mod;
      } catch (err) {
        console.error(`Could not attach operational array logic to slot: ${app}`, err);
      }
    }

  } else {
    // STANDALONE USER ACCESS ROUTE: Standard users only get their own screen layout architecture
    try {
      let modulePath = `./modules/${AppState.role}.js`;
      const module = await import(modulePath);
      AppState.modules[AppState.role] = module;
      module.init(inputTarget, displayTarget);
    } catch (error) {
      showToast("Application module mounting error.", "error");
    }
  }
}

export async function secureFetch(url, options = {}) {
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${AppState.token}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch(url, options);
  if (response.status === 403 || response.status === 401) terminateSession();
  return response;
}

export function showToast(message, type = 'info') {
  const toast = document.getElementById('global-toast');
  toast.innerText = message;
  toast.className = `fixed bottom-5 right-5 z-50 transition-all duration-300 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold text-white ${
    type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-stone-900'
  }`;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3500);
}

// Global WebSocket Broadcast Refresh Pipe Listener Loops
socket.on('new_request', () => {
  Object.values(AppState.modules).forEach(mod => { if (mod.refresh) mod.refresh(); });
});
socket.on('request_completed', () => {
  Object.values(AppState.modules).forEach(mod => { if (mod.refresh) mod.refresh(); });
});
