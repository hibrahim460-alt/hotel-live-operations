import { secureFetch, showToast } from '../app.js';

let formContainer, viewContainer;
const housekeepingTasks = ["In-house Room Cleaning", "Room Check-out", "add-Extra Bed", "add Baby-Crib ", "Extra Bath Towel"];

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <h3 class="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">Engineering Console</h3>
    <p class="text-xs text-stone-500 leading-relaxed">Read-only queue access. Use the checklist viewport to clear pending hardware work orders.</p>
  `;

  viewContainer.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-black tracking-tight text-stone-900">🛠️ Engineering Open Work Orders</h3>
        <button id="btn-refresh-maint" class="px-2.5 py-1 text-xs border border-stone-200 rounded-md hover:bg-stone-50 font-bold">🔄 Sync</button>
      </div>
      <div id="maint-live-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
    </div>
  `;

  document.getElementById('btn-refresh-maint').onclick = refresh;
}

export async function refresh() {
  const grid = document.getElementById('maint-live-grid');
  if (!grid) return;

  try {
    const res = await secureFetch('/api/requests/today');
    const data = await res.json();
    
    // Filters out housekeeping requests so engineers only see structural issues
    const filtered = data.filter(item => !housekeepingTasks.includes(item.issue_category));
    
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `<p class="text-xs text-stone-400 italic py-6 sm:col-span-2 text-center">All systems operational. No engineering tickets open.</p>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border flex justify-between items-center transition-all ${
        item.status === 'completed' ? 'bg-stone-50/50 border-stone-200/60 opacity-60' : 'bg-amber-50/20 border-amber-200/60'
      }`;
      
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      card.innerHTML = `
        <div>
          <span class="text-xs font-black text-stone-900 block">Room ${item.room_number}</span>
          <span class="text-xs text-amber-800 font-bold block mt-0.5">${item.issue_category}</span>
          ${item.notes ? `<p class="text-[11px] text-stone-500 mt-1 italic">"${item.notes}"</p>` : ''}
          <span class="text-[10px] text-stone-400 block mt-1 font-mono">Log Time: ${timeStr} | Op: ${item.createdBy}</span>
        </div>
      `;

      if (item.status === 'pending') {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1.5 bg-stone-900 text-white font-bold text-[10px] rounded-lg shadow-xs hover:bg-stone-800 transition shrink-0 ml-2";
        btn.innerText = "Clear Fix";
        btn.onclick = async () => {
          await secureFetch(`/api/requests/${item._id}/complete`, { method: 'PATCH' });
          showToast(`Room ${item.room_number} hardware clear.`);
          refresh();
        };
        card.appendChild(btn);
      } else {
        card.innerHTML += `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">Cleared: ${item.completedBy}</span>`;
      }

      grid.appendChild(card);
    });
  } catch (e) {
    showToast("Error reading engineering files.", "error");
  }
}
