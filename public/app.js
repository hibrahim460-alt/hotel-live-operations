// Master Controller & Shared State Module Hub
const socket = io();

export const AppState = {
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  username: localStorage.getItem('username') || '',
  activeModule: null,
  cachedData: []
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

// ROUTING MATRIX: Loads app components dynamically instantly based on user clearances
async function initializeWorkspace() {
  document.getElementById('auth-gate').classList.add('hidden');
  const shell = document.getElementById('workspace-shell');
  shell.classList.remove('hidden');

  const badge = document.getElementById('user-badge');
  badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> ${AppState.username.toUpperCase()} (${AppState.role.toUpperCase()})`;

  // Display Approval Dashboard Tab to users authorized to issue cross-department verifications
  if (['admin', 'accounting', 'purchasing'].includes(AppState.role)) {
    document.getElementById('approval-pill-container').classList.remove('hidden');
    document.getElementById('nav-approvals-btn').onclick = () => mountApprovalInbox();
    syncApprovalCountBadge();
  }

  // LAZY LOADING TRIGGERS: Fetches only the JavaScript requested by the system role profile
  try {
    let modulePath = `./modules/${AppState.role}.js`;
    const module = await import(modulePath);
    AppState.activeModule = module;
    
    // Inject and execute module logic instantly
    module.init(document.getElementById('module-input-target'), document.getElementById('module-display-target'));
  } catch (error) {
    console.error("Failed to load application profile framework component.", error);
    showToast("Application module mounting error.", "error");
  }
}

// GLOBAL UTILITY HOOKS FOR ALL SUB-MODULES
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

// SHARED INTER-DEPARTMENT CROSS APPROVAL MODULE SCREEN
async function mountApprovalInbox() {
  const displayTarget = document.getElementById('module-display-target');
  displayTarget.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
      <h3 class="text-lg font-black text-stone-900">🔔 Inter-Department Routing Approvals Inbox</h3>
      <p class="text-xs text-stone-400">Cross-department operations requiring management clearance parameters before ledger lock-in.</p>
      <div id="approvals-list-target" class="space-y-2 pt-2"></div>
    </div>
  `;
  renderApprovalItemsList();
}

export async function syncApprovalCountBadge() {
  try {
    let count = 0;
    if (AppState.role === 'admin' || AppState.role === 'purchasing') {
      const res = await secureFetch('/api/purchasing/orders');
      const orders = await res.json();
      count += orders.filter(o => o.status === 'requested').length;
    }
    if (AppState.role === 'admin' || AppState.role === 'accounting') {
      const res = await secureFetch('/api/accounting/disputes');
      const disputes = await res.json();
      count += disputes.filter(d => d.status === 'pending_review').length;
    }
    document.getElementById('global-approval-count').innerText = count;
  } catch(e){}
}

async function renderApprovalItemsList() {
  const target = document.getElementById('approvals-list-target');
  target.innerHTML = '';
  
  if (AppState.role === 'purchasing' || AppState.role === 'admin') {
    const res = await secureFetch('/api/purchasing/orders');
    const orders = await res.json();
    orders.filter(o => o.status === 'requested').forEach(o => {
      const div = document.createElement('div');
      div.className = "p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex justify-between items-center text-xs";
      div.innerHTML = `<div>📦 <b>Procurement Order Requisition:</b> ${o.item_name} (Qty: ${o.quantity_requested}) <span class="block text-[10px] text-stone-400">Submitted by: ${o.createdBy}</span></div>`;
      const btn = document.createElement('button'); btn.className = "px-3 py-1.5 bg-stone-900 text-white font-bold rounded-lg text-[10px]"; btn.innerText = "Authorize & Order";
      btn.onclick = async () => {
        await secureFetch(`/api/purchasing/orders/${o._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ordered' }) });
        showToast("Procurement request authorized."); syncApprovalCountBadge(); mountApprovalInbox();
      };
      div.appendChild(btn); target.appendChild(div);
    });
  }

  if (AppState.role === 'accounting' || AppState.role === 'admin') {
    const res = await secureFetch('/api/accounting/disputes');
    const disputes = await res.json();
    disputes.filter(d => d.status === 'pending_review').forEach(d => {
      const div = document.createElement('div');
      div.className = "p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex justify-between items-center text-xs";
      div.innerHTML = `<div>🧾 <b>Financial Account Dispute Notice:</b> Room ${d.room_number} ($${d.disputed_amount}) <span class="block text-[10px] text-stone-400">Filed by: ${d.loggedBy} | Reason: "${d.reason}"</span></div>`;
      const btn = document.createElement('button'); btn.className = "px-3 py-1.5 bg-stone-900 text-white font-bold rounded-lg text-[10px]"; btn.innerText = "Approve Financial Write-off";
      btn.onclick = async () => {
        await secureFetch(`/api/accounting/disputes/${d._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) });
        showToast("Credit correction authorized."); syncApprovalCountBadge(); mountApprovalInbox();
      };
      div.appendChild(btn); target.appendChild(div);
    });
  }
}

// Live real-time socket refresh pipelines
socket.on('new_request', () => { if(AppState.activeModule?.refresh) AppState.activeModule.refresh(); syncApprovalCountBadge(); });
socket.on('request_completed', () => { if(AppState.activeModule?.refresh) AppState.activeModule.refresh(); syncApprovalCountBadge(); });
