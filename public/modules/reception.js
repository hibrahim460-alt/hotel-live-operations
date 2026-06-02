import { secureFetch, showToast } from '../app.js';

let formContainer, viewContainer;
const housekeepingTasks = ["In-house Room Cleaning", "Room Check-out", "add-Extra Bed", "add Baby-Crib ", "Extra Bath Towel"];
const maintenanceTasks = ["AC-Checkup", "Kettle is not working", "sink", "water leakage ", "Lighting", "fridge "];

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <h3 class="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Front Office Routing</h3>
    <form id="rc-dispatch-form" class="space-y-3">
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Room target</label>
        <input type="text" id="rc_room" required placeholder="Room Number" class="w-full p-2 border text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900">
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Guest Profile Signature</label>
        <input type="text" id="rc_guest" required placeholder="Guest Name" class="w-full p-2 border text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900">
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Task Category Allocation</label>
        <select id="rc_cat" class="w-full p-2 border text-xs rounded-lg focus:outline-none"></select>
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Context Notes</label>
        <textarea id="rc_notes" placeholder="Add custom request flags..." class="w-full p-2 border text-xs rounded-lg focus:outline-none h-14"></textarea>
      </div>
      <button type="submit" class="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-sm hover:bg-stone-800 transition">Dispatch Task Request</button>
    </form>
  `;

  const select = document.getElementById('rc_cat');
  housekeepingTasks.concat(maintenanceTasks).forEach(t => select.appendChild(new Option(t, t)));
  document.getElementById('rc-dispatch-form').onsubmit = handleFormSubmission;

  viewContainer.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
      <div>
        <h3 class="text-lg font-black tracking-tight text-stone-900">🛎️ Dynamic Room Operations Pipeline</h3>
        <p class="text-xs text-stone-400 mt-0.5">Live view monitoring of pending guest requests routed to sub-departments.</p>
      </div>
      <div id="rc-live-list" class="space-y-2 max-h-[500px] overflow-y-auto pr-1"></div>
    </div>
  `;
}

export async function refresh() {
  const container = document.getElementById('rc-live-list');
  if (!container) return;

  try {
    const res = await secureFetch('/api/requests/today');
    const data = await res.json();
    
    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML = `<p class="text-xs text-stone-400 italic py-8 text-center">No service requests dispatched today.</p>`;
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = "p-3.5 rounded-xl border flex justify-between items-center text-xs bg-stone-50 border-stone-200/70 hover:border-stone-300 transition-all";
      
      const isHK = housekeepingTasks.includes(item.issue_category);
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      div.innerHTML = `
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="font-black text-stone-900 text-sm">Room ${item.room_number}</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isHK ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
            }">${isHK ? 'Housekeeping' : 'Engineering'}</span>
          </div>
          <span class="text-stone-700 font-medium block">${item.issue_category} <span class="text-stone-400 font-normal">(${item.guest_name})</span></span>
          <span class="text-[10px] text-stone-400 block font-mono">Dispatched: ${timeStr} | Op: ${item.createdBy}</span>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
            item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
          }">${item.status === 'completed' ? `✓ Done by ${item.completedBy}` : 'In Progress'}</span>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    showToast("Ops pipeline syncing error.", "error");
  }
}

async function handleFormSubmission(e) {
  e.preventDefault();
  const payload = {
    room_number: document.getElementById('rc_room').value.trim(),
    guest_name: document.getElementById('rc_guest').value.trim(),
    issue_category: document.getElementById('rc_cat').value,
    notes: document.getElementById('rc_notes').value.trim()
  };

  const res = await secureFetch('/api/requests', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) {
    showToast("Task authorized and broadcast to sub-department queues.");
    document.getElementById('rc-dispatch-form').reset();
    refresh();
  }
}
