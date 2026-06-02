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
    <h3 class="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Provision Profile</h3>
    <form id="adm-user-form" class="space-y-3">
      <input type="text" id="adm_user" required placeholder="Username Handle" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="text" id="adm_pass" required placeholder="Password Token" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <select id="adm_role" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
        <option value="reception">🛎️ Reception</option>
        <option value="maintenance">🛠️ Maintenance</option>
        <option value="housekeeping">🧹 Housekeeping</option>
        <option value="purchasing">📦 Purchasing</option>
        <option value="reservations">📅 Reservations</option>
        <option value="accounting">🧾 Accounting</option>
        <option value="sales">📈 Sales</option>
      </select>
      <button type="submit" class="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-sm hover:bg-stone-800 transition">Provision User</button>
    </form>
  `;

  document.getElementById('adm-user-form').onsubmit = handleUserCreation;

  viewContainer.innerHTML = `
    <div class="bg-stone-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
      <h3 class="text-amber-400 text-sm font-black uppercase tracking-wider">👑 Active System Roster Handles</h3>
      <div id="adm-roster-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-stone-300"></div>
    </div>
  `;
}

export async function refresh() {
  const target = document.getElementById('adm-roster-list');
  if (!target) return;

  try {
    const res = await secureFetch('/api/admin/users');
    const roster = await res.json();
    
    target.innerHTML = roster.map(u => `
      <div class="p-2.5 bg-stone-800/80 border border-stone-700/50 rounded-xl flex justify-between items-center">
        <div>
          <span class="text-white font-bold block">${u.username}</span>
          <span class="text-stone-400 text-[10px] uppercase tracking-wider">${u.role}</span>
        </div>
        <span class="text-amber-300 bg-amber-950/40 border border-amber-900/40 px-1.5 py-0.5 rounded text-[10px]">${u.password}</span>
      </div>
    `).join('');
  } catch(e) {}
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
    showToast("Employee profile generated successfully.");
    document.getElementById('adm-user-form').reset();
    refresh();
  }
}
