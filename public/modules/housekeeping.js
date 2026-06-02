import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  // HOUSEKEEPING WORKSPACE: Room management plus an direct cross-departmental alert console for maintenance
  formContainer.innerHTML = `
    <div class="space-y-5 text-stone-900">
      <div>
        <h3 class="text-purple-600 text-xs font-black uppercase tracking-wider">🧹 Housekeeping Workspace</h3>
        <p class="text-[10px] text-stone-400 mt-0.5 leading-tight">Log cleanings or instantly dispatch urgent repair notices directly to the Engineering Team.</p>
      </div>

      <form id="hk-maintenance-alert-form" class="space-y-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
        <div class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span class="text-[9px] uppercase font-black tracking-wider text-amber-800 block">Direct Engineering Alert Pipeline</span>
        </div>
        <p class="text-[9px] text-amber-700 leading-tight">Found a broken fixture, leak, or electrical fault during inspection? Route it to Maintenance instantly here.</p>
        
        <div>
          <input type="text" id="hk_alert_room" required placeholder="Target Room Number" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none">
        </div>
        <div>
          <select id="hk_alert_task" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none">
            <option value="AC Repair Malfunction">AC / HVAC Air Conditioning Fix</option>
            <option value="Plumbing Leak / Toilet issue">Plumbing Issue / Pipe Leakage</option>
            <option value="Electrical Repair / Lights out">Electrical / Blown Bulb / Outlet Fix</option>
            <option value="Door Lock / Keycard Reader Failure">Electronic Lock / Keycard Reader Fix</option>
            <option value="TV / Network Connectivity issue">TV / Smart Electronics Connectivity</option>
            <option value="Furniture Breakdown Restoration">Furniture / Structural Damage</option>
          </select>
        </div>
        <div>
          <textarea id="hk_alert_notes" rows="1.5" required placeholder="Describe what needs fixing explicitly (e.g. Bathroom sink pipe dripping water)..." class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-amber-500"></textarea>
        </div>
        <button type="submit" class="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-xs">
          Dispatch Direct to Maintenance
        </button>
      </form>

      <form id="hk-standard-form" class="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
        <span class="text-[9px] uppercase font-black tracking-wider text-stone-400 block mb-1">Standard Room Service Log</span>
        <div>
          <input type="text" id="hk_room" required placeholder="Room Number" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none">
        </div>
        <div>
          <select id="hk_task" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none">
            <option value="Full Room Cleaning Dispatch">Full Deep Room Cleaning</option>
            <option value="Fresh Linen / Pillow / Towel Delivery">Fresh Linens & Towels Refresh</option>
            <option value="Bathroom Amenities Re-stock">Restock Toiletries & Consumables</option>
            <option value="Turn-down Service Delivery">Evening Turn-down Service</option>
          </select>
        </div>
        <button type="submit" class="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all">
          Log Housekeeping Service
        </button>
      </form>
    </div>
  `;

  viewContainer.innerHTML = `
    <div class="space-y-3">
      <div class="border-b border-stone-200 pb-1">
        <h4 class="text-stone-500 text-xs font-black uppercase tracking-wider">🧹 Housekeeping Queue Status</h4>
      </div>
      <div id="hk-tasks-target" class="space-y-2"></div>
    </div>
  `;

  document.getElementById('hk-standard-form').onsubmit = handleStandardHKSubmit;
  document.getElementById('hk-maintenance-alert-form').onsubmit = handleHKMaintenanceAlertSubmit;
}

export async function refresh() {
  const container = document.getElementById('hk-tasks-target');
  if (!container) return;

  try {
    const res = await secureFetch('/api/requests/today');
    const tasks = await res.json();

    if (tasks.length === 0) {
      container.innerHTML = `<div class="text-stone-400 text-center text-xs italic p-4">No active records registered in Housekeeping queue.</div>`;
      return;
    }

    container.innerHTML = tasks.map(task => {
      const isPending = task.status === 'pending';
      return `
        <div class="p-3 bg-white border border-stone-200 rounded-xl space-y-1 text-xs">
          <div class="flex justify-between items-center">
            <div>
              <span class="px-1.5 py-0.5 bg-purple-900 text-white font-mono font-bold text-[9px] rounded">Rm ${task.room_number}</span>
              <span class="font-bold text-stone-900 ml-1">${task.specific_task}</span>
            </div>
            <span>
              ${isPending ? `
                <button type="button" data-hk-done-id="${task._id}" class="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-bold uppercase rounded transition">Mark Done</button>
              ` : `<span class="px-1.5 bg-stone-100 text-stone-400 rounded text-[9px]">Closed</span>`}
            </span>
          </div>
          ${task.notes ? `<p class="text-[10px] text-stone-500 italic bg-stone-50 p-1 rounded">${task.notes}</p>` : ''}
          <div class="text-[8px] font-mono text-stone-400">Logged by: ${task.createdBy} @ ${new Date(task.timestamp).toLocaleTimeString()}</div>
        </div>
      `;
    }).join('');

    tasks.forEach(task => {
      if (task.status === 'pending') {
        const btn = container.querySelector(`[data-hk-done-id="${task._id}"]`);
        if (btn) btn.onclick = () => closeHKTask(task._id);
      }
    });

  } catch (e) { console.error("Error loading housekeeping view:", e); }
}

async function handleStandardHKSubmit(e) {
  e.preventDefault();
  const room_number = document.getElementById('hk_room').value.trim();
  const specific_task = document.getElementById('hk_task').value;

  try {
    const res = await secureFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        room_number,
        guest_name: "Room Occupant",
        issue_category: "Housekeeping Operations",
        specific_task,
        notes: "Logged via Housekeeping Staff Profile Console Interface"
      })
    });
    if (res.ok) {
      showToast("Housekeeping task logged successfully.", "success");
      document.getElementById('hk-standard-form').reset();
      refresh();
    }
  } catch (err) { showToast("Pipeline processing error.", "error"); }
}

async function handleHKMaintenanceAlertSubmit(e) {
  e.preventDefault();
  const room_number = document.getElementById('hk_alert_room').value.trim();
  const specific_task = document.getElementById('hk_alert_task').value;
  const notes = document.getElementById('hk_alert_notes').value.trim();

  try {
    // Crucial Inter-departmental Redirection: Dispatched directly to Engineering category
    const res = await secureFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        room_number,
        guest_name: "Inspection Logged",
        issue_category: "Engineering & Maintenance", // Maps to engineering users immediately
        specific_task,
        notes: `🚨 Urgent Engineering Alert from Housekeeping Staff: ${notes}`
      })
    });

    if (res.ok) {
      showToast("Urgent notification delivered to Engineering Department.", "success");
      document.getElementById('hk-maintenance-alert-form').reset();
      refresh();
    }
  } catch (err) { showToast("Cross-department network failure.", "error"); }
}

async function closeHKTask(id) {
  try {
    const res = await secureFetch(`/api/requests/${id}/complete`, { method: 'PATCH' });
    if (res.ok) { showToast("Task completed.", "success"); refresh(); }
  } catch (e) { showToast("Error.", "error"); }
}
