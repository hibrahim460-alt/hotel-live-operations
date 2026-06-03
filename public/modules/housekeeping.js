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
    <div class="space-y-5 text-stone-900">
      <div>
        <h3 class="text-purple-600 text-xs font-black uppercase tracking-wider">🧹 Housekeeping Control Station</h3>
        <p class="text-[10px] text-stone-400 mt-0.5 leading-tight">Manage room status and dispatch direct maintenance alert escalations.</p>
      </div>

      <!-- DIRECT ENGINEERING ALERT PIPELINE -->
      <form id="hk-maint-alert-form" class="space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
        <div>
          <span class="text-[9px] uppercase font-black tracking-wider text-amber-800 block">🚨 Direct Engineering Alert Pipeline</span>
          <p class="text-[8px] text-stone-400 leading-tight">Instantly route structural issues straight to the engineering queue.</p>
        </div>
        <div>
          <input type="text" id="hk_maint_room" required placeholder="Room Number (e.g. 305)" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-amber-500">
        </div>

        <!-- RECEPTION-SYNCHRONIZED DROPDOWN INTEGRATION -->
        <div>
          <label class="block text-[8px] uppercase tracking-wider font-bold text-stone-400 mb-1">Explicit Maintenance Issue</label>
          <select id="hk_maint_task_select" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-amber-500 mb-2">
            <option value="Electricity">Electricity</option>
            <option value="Lighting">Lighting</option>
            <option value="Kettle">Kettle</option>
            <option value="AC">AC</option>
            <option value="Toilet Back-a-dush">Toilet Back-a-dush</option>
            <option value="Safety-box locked">Safety-box locked</option>
            <option value="Safety-box reset">Safety-box reset</option>
            <option value="Door configuration">Door configuration</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Socket">Socket</option>
            <option value="Fridge">Fridge</option>
            <option value="Windows">Windows</option>
            <option value="others">Other (Type custom request below)</option>
          </select>

          <!-- Fallback input field for customized engineering requests -->
          <input type="text" id="hk_maint_task_custom" placeholder="Specify custom maintenance defect details..." class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-amber-500 hidden">
        </div>

        <div>
          <textarea id="hk_maint_notes" rows="2" placeholder="Urgency context or location details..." class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-amber-500"></textarea>
        </div>
        <button type="submit" class="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all">
          Broadcast Maintenance Alert
        </button>
      </form>
    </div>
  `;

  viewContainer.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-stone-200 pb-1 flex justify-between items-center">
        <h4 class="text-stone-500 text-xs font-black uppercase tracking-wider">🧹 Current Active Housekeeping Allocations</h4>
        <button id="btn-hk-refresh" class="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold px-2 py-0.5 rounded border border-stone-200 transition-all">🔄 Sync List</button>
      </div>
      <!-- TASK FEED INTERFACE -->
      <div id="housekeeping-tasks-feed" class="space-y-2"></div>
    </div>
  `;

  // Attach execution triggers
  document.getElementById('hk-maint-alert-form').onsubmit = handleEngineeringAlertSubmit;
  document.getElementById('btn-hk-refresh').onclick = refresh;

  // Real-time visual toggle engine for the custom text fallback field
  const taskSelect = document.getElementById('hk_maint_task_select');
  const customInput = document.getElementById('hk_maint_task_custom');

  taskSelect.onchange = () => {
    if (taskSelect.value === 'others') {
      customInput.classList.remove('hidden');
      customInput.required = true;
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
    }
  };
}

export async function refresh() {
  const container = document.getElementById('housekeeping-tasks-feed');
  if (!container) return;

  container.innerHTML = `<span class="text-[10px] italic text-stone-400 block py-2">Syncing latest allocations...</span>`;

  try {
    const res = await secureFetch('/api/requests/today');
    const tasks = await res.json();

    // Pull strictly tasks targeted for Housekeeping operations
    const housekeepingSubset = tasks.filter(t => t.issue_category === 'Housekeeping Operations');

    if (housekeepingSubset.length === 0) {
      container.innerHTML = `<span class="text-[10px] italic text-stone-400 block py-1">No active room cleaning or service workflows assigned.</span>`;
      return;
    }

    container.innerHTML = housekeepingSubset.map(task => {
      const isPending = task.status === 'pending';
      return `
        <div class="p-2.5 bg-white border border-stone-200 rounded-xl shadow-2xs text-[11px] flex justify-between items-center">
          <div>
            <span class="font-mono bg-purple-600 text-white px-1.5 py-0.5 text-[9px] font-black rounded">Rm ${task.room_number}</span>
            <span class="font-black text-stone-800 ml-1.5">${task.specific_task}</span>
            <span class="text-stone-400 text-[10px] block mt-0.5">Guest: ${task.guest_name} ${task.notes ? `| Obs: ${task.notes}` : ''}</span>
            <span class="text-[8px] font-mono text-stone-400 block mt-0.5">Dispatched by: ${task.createdBy} @ ${new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>
            ${isPending ? `
              <button type="button" data-hk-done-id="${task._id}" class="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all">Clear Task</button>
            ` : `<span class="text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-mono">Closed by ${task.completedBy}</span>`}
          </div>
        </div>
      `;
    }).join('');

    housekeepingSubset.forEach(task => {
      if (task.status === 'pending') {
        const btn = container.querySelector(`[data-hk-done-id="${task._id}"]`);
        if (btn) btn.onclick = () => clearHousekeepingTaskInstance(task._id);
      }
    });

  } catch (err) {
    console.error("Housekeeping live sync tracking error:", err);
  }
}

async function handleEngineeringAlertSubmit(e) {
  e.preventDefault();

  const room_number = document.getElementById('hk_maint_room').value.trim();
  const selectVal = document.getElementById('hk_maint_task_select').value;
  const notes = document.getElementById('hk_maint_notes').value.trim();

  // Resolve specific task name text string values dynamically
  const specific_task = (selectVal === 'others') ? document.getElementById('hk_maint_task_custom').value.trim() : selectVal;

  if (!room_number || !specific_task) {
    showToast("Please complete all alert configuration vectors.", "error");
    return;
  }

  try {
    const res = await secureFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        room_number,
        guest_name: "HK Escalation", // Fallback label since housekeeping targets direct hardware asset items
        issue_category: "Engineering & Maintenance", // Safely cross-routes right into the engineering feed
        specific_task,
        notes: notes ? `[HK Alert Room Broadcast]: ${notes}` : "[HK Alert Room Broadcast]"
      })
    });

    if (res.ok) {
      showToast("Alert pushed directly onto Engineering workflow stream.", "success");
      document.getElementById('hk-maint-alert-form').reset();
      
      // Clean display elements state configuration post reset 
      document.getElementById('hk_maint_task_custom').classList.add('hidden');
      document.getElementById('hk_maint_task_custom').required = false;
      
      refresh();
    } else {
      const errorData = await res.json();
      showToast(`Alert dispatch rejected: ${errorData.error || 'Server error'}`, "error");
    }
  } catch (err) {
    showToast("Network pipeline synchronization issue.", "error");
  }
}

async function clearHousekeepingTaskInstance(taskId) {
  try {
    const res = await secureFetch(`/api/requests/${taskId}/complete`, { method: 'PATCH' });
    if (res.ok) {
      showToast("Housekeeping task status cleared.", "success");
      refresh();
    }
  } catch (err) {
    showToast("Error processing completion signature.", "error");
  }
}
