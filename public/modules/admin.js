import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

const SYSTEM_ROLES_ARRAY = [
  { id: 'admin', label: '👑 Admin' },
  { id: 'executive', label: '📊 Exec' },
  { id: 'operations', label: '⚙️ Ops' },
  { id: 'reception', label: '🛎️ Front' },
  { id: 'housekeeping', label: '🧹 HK' },
  { id: 'maintenance', label: '🛠️ Eng' },
  { id: 'purchasing', label: '📦 Supply' },
  { id: 'accounting', label: '🧾 Audit' },
  { id: 'sales', label: '📈 Sales' },
  { id: 'reservations', label: '📅 Book' }
];

let currentlyEditingUserId = null;

export function init(formElement, viewElement) { 
  formContainer = formElement; 
  viewContainer = viewElement; 
  currentlyEditingUserId = null;
  renderWorkspaceLayout(); 
  refresh(); 
}

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <div class="space-y-4 text-stone-900">
      <div>
        <h3 class="text-amber-400 text-xs font-black uppercase tracking-wider">👑 System Security Panel</h3>
        <p class="text-[10px] text-stone-400 mt-0.5 leading-tight">Provision system identifiers, configure granular roles, and monitor user databases.</p>
      </div>
      
      <div id="adm-form-card" class="bg-stone-850 p-4 rounded-xl border border-stone-800 space-y-3">
        <h4 id="form-context-title" class="text-[11px] font-black text-white uppercase tracking-wider">Provision New Account Identity</h4>
        
        <form id="adm-user-form" class="space-y-2.5">
          <div>
            <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Account Handle ID</label>
            <input type="text" id="adm_user" required placeholder="e.g. j.smith" class="w-full p-2 bg-stone-800 border border-stone-700 text-white font-mono text-xs rounded-lg focus:outline-none focus:border-amber-400">
          </div>
          
          <div>
            <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Security Passkey String</label>
            <input type="text" id="adm_pass" required placeholder="Access password code" class="w-full p-2 bg-stone-800 border border-stone-700 text-white font-mono text-xs rounded-lg focus:outline-none focus:border-amber-400">
          </div>
          
          <div>
            <label class="block text-[9px] uppercase tracking-wider font-bold text-stone-400 mb-1">Clearance Allocation Strategy</label>
            <select id="adm_role" class="w-full p-2 bg-stone-800 border border-stone-700 text-white text-xs rounded-lg focus:outline-none">
              <option value="reception">🛎️ Reception</option>
              <option value="housekeeping">🧹 Housekeeping</option>
              <option value="maintenance">🛠️ Maintenance</option>
              <option value="purchasing">📦 Purchasing</option>
              <option value="reservations">📅 Reservations</option>
              <option value="accounting">🧾 Accounting</option>
              <option value="sales">📈 Sales</option>
              <option value="operations">⚙️ Operations Manager</option>
              <option value="executive">📊 Corporate Senior Executive</option>
              <option value="admin">👑 System Admin</option>
            </select>
          </div>
          
          <div id="form-action-button-group" class="pt-1">
            <button type="submit" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-[0.99]">
              Provision User Access
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('adm-user-form').onsubmit = handleFormExecution;
  
  viewContainer.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center border-b border-stone-200 pb-2">
        <h4 class="text-stone-500 text-xs font-black uppercase tracking-wider">System Enrolled Profiles Roster Index</h4>
        <span id="roster-count-badge" class="px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold text-stone-600 border">0 Accounts</span>
      </div>
      <div id="adm-roster-list" class="space-y-2 text-[11px]"></div>
    </div>
  `;
}

export async function refresh() {
  const list = document.getElementById('adm-roster-list'); 
  if (!list) return;
  
  try {
    const res = await secureFetch('/api/admin/users'); 
    const users = await res.json();
    document.getElementById('roster-count-badge').innerText = `${(users || []).length} Profiles Active`;
    
    list.innerHTML = (users || []).map(user => {
      return `
        <div class="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-stone-900 font-bold text-xs">${user.username}</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-stone-200 text-stone-700 border border-stone-300/40">${user.password}</span>
            </div>
            
            <div class="grid grid-cols-5 gap-1.5 pt-1" id="matrix-grid-${user._id}">
              ${SYSTEM_ROLES_ARRAY.map(roleOption => {
                const isChecked = user.role === roleOption.id;
                return `
                  <label class="flex items-center gap-1 text-[9px] font-medium text-stone-500 select-none">
                    <input type="checkbox" 
                           data-user-id="${user._id}" 
                           data-role-id="${roleOption.id}"
                           ${isChecked ? 'checked' : ''} 
                           disabled
                           class="rounded border-stone-300 text-indigo-600 focus:ring-0 w-3 h-3 font-sans pointer-events-none">
                    <span>${roleOption.label}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end border-t md:border-none pt-2 md:pt-0 border-stone-200">
            <button type="button" 
                    data-edit-btn-id="${user._id}"
                    class="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
              Edit
            </button>
            <button type="button" 
                    data-delete-btn-id="${user._id}"
                    class="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-stone-200 hover:border-rose-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    (users || []).forEach(user => {
      document.querySelector(`[data-edit-btn-id="${user._id}"]`).onclick = () => activateInlineEditState(user);
      document.querySelector(`[data-delete-btn-id="${user._id}"]`).onclick = () => triggerIdentityPurge(user._id);
    });

  } catch(err) {
    console.error("Roster extraction error context tracing execution stream:", err);
  }
}

function activateInlineEditState(user) {
  currentlyEditingUserId = user._id;
  
  document.getElementById('form-context-title').innerText = `Retooling Profile: ${user.username}`;
  document.getElementById('adm_user').value = user.username;
  document.getElementById('adm_user').disabled = true; 
  document.getElementById('adm_pass').value = user.password;
  document.getElementById('adm_role').value = user.role;
  
  document.getElementById('form-action-button-group').innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <button type="submit" class="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all">
        Save Rights
      </button>
      <button type="button" id="btn-cancel-edit" class="py-2 bg-stone-700 hover:bg-stone-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all">
        Cancel
      </button>
    </div>
  `;
  
  document.getElementById('btn-cancel-edit').onclick = resetFormToDefaultState;
  
  document.querySelectorAll('input[data-user-id]').forEach(checkbox => {
    if (checkbox.getAttribute('data-user-id') === user._id) {
      checkbox.disabled = false;
      checkbox.style.pointerEvents = 'auto';
      
      checkbox.onclick = (e) => {
        const checkedRole = e.target.getAttribute('data-role-id');
        document.getElementById('adm_role').value = checkedRole;
        
        document.querySelectorAll(`input[data-user-id="${user._id}"]`).forEach(cb => {
          if (cb.getAttribute('data-role-id') !== checkedRole) cb.checked = false;
        });
      };
    } else {
      checkbox.disabled = true;
      checkbox.style.pointerEvents = 'none';
    }
  });

  showToast(`Modifying clearance access configuration bounds for: ${user.username}`);
}

function resetFormToDefaultState() {
  currentlyEditingUserId = null;
  document.getElementById('adm-user-form').reset();
  document.getElementById('adm_user').disabled = false;
  document.getElementById('form-context-title').innerText = "Provision New Account Identity";
  document.getElementById('form-action-button-group').innerHTML = `
    <button type="submit" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all">
      Provision User Access
    </button>
  `;
  refresh();
}

async function handleFormExecution(e) {
  e.preventDefault();
  
  const username = document.getElementById('adm_user').value.trim();
  const password = document.getElementById('adm_pass').value.trim();
  const role = document.getElementById('adm_role').value;
  
  if (currentlyEditingUserId) {
    const res = await secureFetch(`/api/admin/users/${currentlyEditingUserId}`, {
      method: 'PUT',
      body: JSON.stringify({ password, role })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast("Identity permission matrix modified successfully.", "success");
      resetFormToDefaultState();
    } else {
      showToast(data.error || "Profile adjustment transaction declined.", "error");
    }
  } else {
    const res = await secureFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast("Identity access privileges provisioned securely.", "success");
      document.getElementById('adm-user-form').reset();
      refresh();
    } else {
      showToast(data.error || "Failed to initialize identity allocation credentials.", "error");
    }
  }
}

async function triggerIdentityPurge(userId) {
  if (!confirm("Confirm Account Purge: Irreversible operational action.")) return;
  
  try {
    const res = await secureFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (res.ok) {
      showToast("Account dropped from security credential registers successfully.", "success");
      if (currentlyEditingUserId === userId) resetFormToDefaultState();
      refresh();
    } else {
      showToast(data.error || "Purge request denied by security cluster verification checks.", "error");
    }
  } catch(err) {
    showToast("Network fault during execution route removal.", "error");
  }
}
