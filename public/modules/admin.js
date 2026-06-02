import { secureFetch, showToast } from '../app.js';

let formContainer, viewContainer;

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="text-amber-400 text-sm font-black uppercase tracking-wider">👑 System Security Engine</h3>
        <p class="text-[11px] text-stone-400 leading-relaxed mt-0.5">Deploy new operational identities, manage functional permission sets, and override credential flags.</p>
      </div>
      
      <form id="adm-user-form" class="space-y-3 pt-2 text-stone-900">
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Account Handle ID</label>
          <input type="text" id="adm_user" required placeholder="e.g. john_reception" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400">
        </div>
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Clearance Security Token (Password)</label>
          <input type="text" id="adm_pass" required placeholder="Set password string" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400">
        </div>
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Functional Clearance Role</label>
          <select id="adm_role" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400">
            <option value="reception">🛎️ Reception & Front Desk</option>
            <option value="housekeeping">🧹 Housekeeping Department</option>
            <option value="maintenance">🛠️ Engineering & Maintenance</option>
            <option value="purchasing">📦 Procurement & Supply Line</option>
            <option value="reservations">📅 Reservations Booking Desk</option>
            <option value="accounting">🧾 Back Office Accounting</option>
            <option value="sales">📈 Corporate Sales CRM</option>
            <option value="admin">👑 Root System Administrator</option>
          </select>
        </div>
        <button type="submit" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-[0.98] mt-2">Provision System Access</button>
      </form>
    </div>
  `;

  document.getElementById('adm-user-form').onsubmit = handleUserCreation;

  viewContainer.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center border-b border-stone-800 pb-2">
        <h3 class="text-amber-400 text-xs font-black uppercase tracking-wider">Active System Roster Database</h3>
        <span id="roster-count-badge" class="px-2 py-0.5 bg-stone-800 text-white rounded text-[10px] font-bold">0 Users</span>
      </div>
      <div id="adm-roster-list" class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-stone-300"></div>
    </div>
  `;
}

export async function refresh() {
  const target = document.getElementById('adm-roster-list');
  if (!target) return;

  try {
    const res = await secureFetch('/api/admin/users');
    const roster = await res.json();
    
    document.getElementById('roster-count-badge').innerText = `${roster.length} Profiles Enrolled`;
    
    target.innerHTML = roster.map(u => `
      <div class="p-3 bg-stone-900 border border-stone-800 rounded-xl flex justify-between items-center hover:border-stone-700 transition-colors">
        <div>
          <span class="text-white font-bold block tracking-tight">${u.username}</span>
          <span class="text-stone-500 text-[10px] uppercase font-sans tracking-wider block mt-0.5 font-bold ${u.role === 'admin' ? 'text-amber-500' : ''}">Role: ${u.role}</span>
        </div>
        <div class="text-right">
          <label class="block text-[8px] uppercase tracking-wider text-stone-600 mb-0.5 font-sans">Pass Token</label>
          <span class="text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-0.5 rounded text-[11px] font-bold">${u.password}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error("Failed to sync system administrative accounts array matrix index.", e);
  }
}

async function handleUserCreation(e) {
  e.preventDefault();
  const payload = {
    username: document.getElementById('adm_user').value.trim(),
    password: document.getElementById('adm_pass').value.trim(),
    role: document.getElementById('adm_role').value
  };

  const res = await secureFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) {
    showToast("Employee account provisioned and mapped to system architecture.");
    document.getElementById('adm-user-form').reset();
    refresh();
  } else {
    const errorData = await res.json();
    showToast(`Access Generation Failed: ${errorData.error}`, "error");
  }
}
