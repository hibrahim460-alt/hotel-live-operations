const socket = io();

export const AppState = {
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  username: localStorage.getItem('username') || '',
  modules: {}
};

document.addEventListener('DOMContentLoaded', () => {
  if (AppState.token) { initializeWorkspace(); } 
  else { document.getElementById('login-form').addEventListener('submit', handleLoginRequest); }
  document.getElementById('logout-btn').addEventListener('click', terminateSession);
});

async function handleLoginRequest(e) {
  e.preventDefault();
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;

  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authorization Denied.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);

    AppState.token = data.token; AppState.role = data.role; AppState.username = data.username;
    showToast(`Access Granted. Systems Online.`, 'success');
    initializeWorkspace();
  } catch (err) { showToast(err.message, 'error'); }
}

function terminateSession() { localStorage.clear(); location.reload(); }

async function initializeWorkspace() {
  document.getElementById('auth-gate').classList.add('hidden');
  const shell = document.getElementById('workspace-shell'); shell.classList.remove('hidden');

  const badge = document.getElementById('user-badge');
  badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span> CONSOLE ROOT: ${AppState.username.toUpperCase()}`;

  const inputTarget = document.getElementById('module-input-target');
  const displayTarget = document.getElementById('module-display-target');
  inputTarget.innerHTML = ''; displayTarget.innerHTML = '';

  if (AppState.role === 'admin') {
    const shellWrapper = document.querySelector('#workspace-shell > .max-w-7xl');
    shellWrapper.className = "max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8";
    shellWrapper.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section id="admin-input-col" class="lg:col-span-1 bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-xl"></section>
        <section id="admin-display-col" class="lg:col-span-3 bg-stone-950 text-white p-6 rounded-2xl border border-stone-800 shadow-xl max-h-[350px] overflow-y-auto"></section>
      </div>
      <div class="border-t border-stone-200 pt-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-stone-400 mb-6 flex items-center gap-2"><span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span> Enterprise Global Matrix View</h2>
        <div id="master-admin-grid" class="grid grid-cols-1 xl:grid-cols-2 gap-8"></div>
      </div>
    `;

    // Initialize Root Profile Controls First
    const adminModule = await import('./modules/admin.js');
    adminModule.init(document.getElementById('admin-input-col'), document.getElementById('admin-display-col'));
    AppState.modules['admin'] = adminModule;

    // Direct Lazy-Loader Loop over all apps
    const operationalApps = ['bi', 'reception', 'housekeeping', 'maintenance', 'purchasing', 'accounting', 'sales', 'reservations'];
    const gridElement = document.getElementById('master-admin-grid');

    for (const app of operationalApps) {
      const widget = document.createElement('div');
      widget.className = "bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4";
      widget.innerHTML = `
        <div class="flex justify-between items-center border-b border-stone-100 pb-2"><h4 class="text-xs font-black uppercase tracking-wider text-stone-400">Node Framework Instance: ${app}</h4><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="${app}-input-slot" class="md:col-span-1"></div>
          <div id="${app}-display-slot" class="md:col-span-2 max-h-[380px] overflow-y-auto pr-1"></div>
        </div>
      `;
      gridElement.appendChild(widget);

      try {
        const mod = await import(`./modules/${app}.js`);
        mod.init(document.getElementById(`${app}-input-slot`), document.getElementById(`${app}-display-slot`));
        AppState.modules[app] = mod;
      } catch (e) { console.error(`Component mapping error on allocation pointer: ${app}`, e); }
    }
  } else {
    try {
      const standardModule = await import(`./modules/${AppState.role}.js`);
      AppState.modules[AppState.role] = standardModule; standardModule.init(inputTarget, displayTarget);
    } catch (e) { showToast("Initialization runtime link failure.", "error"); }
  }
}

export async function secureFetch(url, options = {}) {
  options.headers = { ...options.headers, 'Authorization': `Bearer ${AppState.token}`, 'Content-Type': 'application/json' };
  const res = await fetch(url, options); if (res.status === 403 || res.status === 401) terminateSession(); return res;
}

export function showToast(msg, type = 'info') {
  const t = document.getElementById('global-toast'); t.innerText = msg;
  t.className = `fixed bottom-5 right-5 z-50 transition-all duration-300 px-4 py-3 rounded-xl shadow-xl font-bold text-white text-xs uppercase tracking-wide ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-stone-900'}`;
  t.classList.remove('translate-y-20', 'opacity-0'); setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3500);
}

socket.on('new_request', () => { Object.values(AppState.modules).forEach(m => { if (m.refresh) m.refresh(); }); });
socket.on('request_completed', () => { Object.values(AppState.modules).forEach(m => { if (m.refresh) m.refresh(); }); });
