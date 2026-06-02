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
        <h3 class="text-amber-400 text-sm font-black uppercase tracking-wider">👑 Security Controls Engine</h3>
        <p class="text-[11px] text-stone-400 leading-relaxed mt-0.5">Provision fresh user signatures, map workspace clearances, and perform real-time verification audits.</p>
      </div>
      
      <form id="adm-user-form" class="space-y-3 pt-1 text-stone-900">
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Account Handle String</label>
          <input type="text" id="adm_user" required placeholder="e.g. reception_mark" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400 font-mono">
        </div>
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Clearance Security Password Token</label>
          <input type="text" id="adm_pass" required placeholder="Enter login password text" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400 font-mono">
        </div>
        <div>
          <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Dynamic Permission Clearance Mapping</label>
          <select id="adm_role" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none focus:border-amber-400">
            <option value="reception">🛎️ Reception & Desk Ops</option>
            <option value="housekeeping">🧹 Housekeeping Department</option>
            <option value="maintenance">🛠️ Engineering & Maintenance</option>
            <option value="purchasing">📦 Procurement Logistics</option>
            <option value="reservations">📅 Reservations Booking Hub</option>
            <option value="accounting">🧾 Back Office Accounts Audit</option>
            <option value="sales">📈 Business Sales CRM Pipeline</option>
            <option value="admin">👑 Root System Administrator Access</option>
          </select>
        </div>
        <button type="submit" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-[0.98] mt-2">Provision Operational Access</button>
      </form>
    </div>
  `;

  document.getElementById('adm-user-form').onsubmit = handleUserCreation;

  viewContainer.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center border-b border-stone-800/80 pb-2">
        <h3 class="text-amber-400 text-xs font-black uppercase tracking-wider">Live Security Enrolled User Roster</h3>
        <span id="roster-count-badge" class="px-2 py-0.5 bg-stone-800 border border-stone-700 text-white rounded text-[10px] font-bold">0 Users Active</span>
      </div>
      <div id="adm-roster-list" class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-stone-300"></div>
    </div>
  `;
}

export async function refresh() {
  const rosterElement = document.getElementById('adm-roster-list');
  if (!rosterElement) return;

  try {
    const res = await secureFetch('/api/admin/users');
    const databaseRoster = await res.json();
    
    document.getElementById('roster-count-badge').innerText = `${databaseRoster.length} Profiles Mapping Active`;
    
    rosterElement.innerHTML = databaseRoster.map(u => `
      <div class="p-3 bg-stone-900 border border-stone-800 rounded-xl flex justify-between items-center hover:border-stone-700 transition-all">
        <div>
          <span class="text-white font-bold block tracking-tight">${u.username}</span>
          <span class="text-stone-500 text-[10px] uppercase font-sans tracking-wider block mt-0.5 font-black ${u.role === 'admin' ? 'text-amber-500' : ''}">Access Scope: ${u.role}</span>
        </div>
        <div class="text-right">
          <label class="block text-[8px] uppercase tracking-wider text-stone-600 mb-0.5 font-sans">Verification Plain</label>
          <span class="text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded text-[11px] font-bold">${u.password}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Administrative user registry cache sync trace error:", err);
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
    showToast("Profile signature deployed live and mapped to system routers.", "success");
    document.getElementById('adm-user-form').reset();
    refresh();
  } else {
    const errorBody = await res.json();
    showToast(`Failed: ${errorBody.error}`, "error");
  }
}
