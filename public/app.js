// Master Controller & Shared State Module Hub
const socket = io();

export const AppState = {
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  username: localStorage.getItem('username') || '',
  modules: {} // Keeps operational memory references to all active layouts
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

    showToast(`Access Verified: Welcome ${data.username}!`, 'success');
    initializeWorkspace();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function terminateSession() {
  localStorage.clear();
  location.reload();
}

// THE ROUTER CONSOLE CORE: Split paths for Root vs Department scopes
async function initializeWorkspace() {
  document.getElementById('auth-gate').classList.add('hidden');
  const shell = document.getElementById('workspace-shell');
  shell.classList.remove('hidden');

  const badge = document.getElementById('user-badge');
  badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span> CONSOLE ROOT: ${AppState.username.toUpperCase()}`;

  const inputTarget = document.getElementById('module-input-target');
  const displayTarget = document.getElementById('module-display-target');

  inputTarget.innerHTML = '';
  displayTarget.innerHTML = '';

  if (AppState.role === 'admin') {
    // Redraw view area mapping templates into structural operational matrices
    const shellWrapper = document.querySelector('#workspace-shell > .max-w-7xl');
    shellWrapper.className = "max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8";
    shellWrapper.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section id="admin-input-col" class="lg:col-span-1 bg-stone-900 text-white p-6 rounded-2xl shadow-xl border border-stone-800 h-fit"></section>
        <section id="admin-display-col" class="lg:col-span-3 bg-stone-950 text-white p-6 rounded-2xl shadow-xl border border-stone-800 h-fit max-h-[400px] overflow-y-auto"></section>
      </div>
      
      <div class="border-t border-stone-200 pt-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-stone-400 mb-6 flex items-center gap-2">
          <span class="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span> Live Global Enterprise Systems Core
        </h2>
        <div id="master-admin-grid" class="grid grid-cols-1 xl:grid-cols-2 gap-8"></div>
      </div>
    `;

    // 1. Instantly load Admin Profile Control Board
    const adminModule = await import('./modules/admin.js');
    adminModule.init(document.getElementById('admin-input-col'), document.getElementById('admin-display-col'));
    AppState.modules['admin'] = adminModule;

    // 2. Loop & mount every standalone application frame onto the Admin view layout workspace
    const subApps = ['reception', 'housekeeping', 'maintenance', 'purchasing', 'accounting', 'sales', 'reservations'];
    const gridElement = document.getElementById('master-admin-grid');

    for (const app of subApps) {
      const widget = document.createElement('div');
      widget.className = "bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4 hover:border-stone-300 transition-all";
      widget.innerHTML = `
        <div class="flex justify-between items-center border-b border-stone-100 pb-2">
          <h4 class="text-xs font-black uppercase tracking-wider text-stone-400">Application Node Module: ${app}</h4>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs"></span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="${app}-input-slot" class="md:col-span-1"></div>
          <div id="${app}-display-slot" class="md:col-span-2 max-h-[380px] overflow-y-auto pr-1"></div>
        </div>
      `;
      gridElement.appendChild(widget);

      try {
        const component = await import(`./modules/${app}.js`);
        component.init(document.getElementById(`${app}-input-slot`), document.getElementById(`${app}-display-slot`));
        AppState.modules[app] = component;
      } catch (err) {
        console.error(`Component injection error for node layout mapping pointer: ${app}`, err);
      }
    }

  } else {
    // STANDARD ACCESS PROTOCOL: Map standard workflows into isolated target locations
    try {
      let modulePath = `./modules/${AppState.role}.js`;
      const structuralModule = await import(modulePath);
      AppState.modules[AppState.role] = structuralModule;
      structuralModule.init(inputTarget, displayTarget);
    } catch (error) {
      showToast("Critical runtime module binding error.", "error");
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

// Websocket sync loops: Pushes continuous refresh triggers across all memory reference registers
socket.on('new_request', () => {
  Object.values(AppState.modules).forEach(m => { if (m.refresh) m.refresh(); });
});
socket.on('request_completed', () => {
  Object.values(AppState.modules).forEach(m => { if (m.refresh) m.refresh(); });
});
