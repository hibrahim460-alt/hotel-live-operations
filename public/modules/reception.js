import { secureFetch, showToast, AppState } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  // PANEL A: Input Controls and Targeted FO Date-Range Report Form
  formContainer.innerHTML = `
    <div class="space-y-4 text-stone-900">
      <div>
        <h3 class="text-indigo-600 text-xs font-black uppercase tracking-wider">🛎️ FO Front Desk Operations</h3>
        <p class="text-[10px] text-stone-400 mt-0.5 leading-tight">Log new guest requests, track service alerts, or generate historical reports by specific dates.</p>
      </div>
      
      <form id="fo-task-form" class="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
        <span class="text-[9px] uppercase font-black tracking-wider text-stone-400 block mb-1">New Task Dispatch</span>
        <div>
          <input type="text" id="fo_room" required placeholder="Room Number (e.g. 102)" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <input type="text" id="fo_guest" required placeholder="Guest Surname" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <select id="fo_category" class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none">
            <option value="Front Desk">🛎️ Front Desk Service</option>
            <option value="Housekeeping">🧹 Housekeeping Dispatch</option>
            <option value="Maintenance">🛠️ Engineering Repair</option>
            <option value="Room Service">🍽️ Room Service Delivery</option>
          </select>
        </div>
        <div>
          <textarea id="fo_notes" rows="1" placeholder="Task details/notes..." class="w-full p-2 bg-white border border-stone-200 text-stone-900 text-xs rounded-lg focus:outline-none focus:border-indigo-500"></textarea>
        </div>
        <button type="submit" class="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all">
          Dispatch Task
        </button>
      </form>

      <div class="bg-stone-900 text-white p-3 rounded-xl space-y-2 border border-stone-800">
        <span class="text-[9px] uppercase font-black tracking-wider text-indigo-400 block">📊 FO Report by Date Range</span>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Start Date</label>
            <input type="date" id="fo_report_start" class="w-full p-1.5 bg-stone-800 border border-stone-700 text-white font-mono text-[10px] rounded focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">End Date</label>
            <input type="date" id="fo_report_end" class="w-full p-1.5 bg-stone-800 border border-stone-700 text-white font-mono text-[10px] rounded focus:outline-none focus:border-indigo-500">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1">
          <button type="button" id="btn-fo-run-report" class="py-1.5 bg-indigo-500 hover:bg-indigo-600 text-stone-950 font-black text-[9px] uppercase tracking-wider rounded transition">
            Run Report
          </button>
          <button type="button" id="btn-fo-clear-report" class="py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[9px] uppercase tracking-wider rounded transition">
            Reset View
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('fo-task-form').onsubmit = handleTaskSubmit;
  document.getElementById('btn-fo-run-report').onclick = compileDateRangeReport;
  document.getElementById('btn-fo-clear-report').onclick = () => {
    document.getElementById('fo_report_start').value = '';
    document.getElementById('fo_report_end').value = '';
    refresh();
  };

  // PANEL B: Live Display Grid Workspace
  viewContainer.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center border-b border-stone-200 pb-2">
        <h4 id="fo-view-title" class="text-stone-500 text-xs font-black uppercase tracking-wider">Live Active Front Desk Stream</h4>
        <span id="fo-mode-badge" class="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Real-Time</span>
      </div>
      <div id="fo-tasks-target" class="space-y-2"></div>
    </div>
  `;
}

export async function refresh() {
  // Standard non-filtered live view renderer
  fetchAndRenderFOData();
}

async function fetchAndRenderFOData(queryString = '') {
  const container = document.getElementById('fo-tasks-target');
  if (!container) return;

  try {
    const res = await secureFetch(`/api/requests/today${queryString}`);
    const tasks = await res.json();

    if (tasks.length === 0) {
      container.innerHTML = `<div class="p-4 text-center italic text-stone-400 text-xs">No entries found matching the query context criteria.</div>`;
      return;
    }

    container.innerHTML = tasks.map(task => {
      const isPending = task.status === 'pending';
      const createdDate = new Date(task.timestamp).toLocaleString();
      const confirmedDate = task.completedAt ? new Date(task.completedAt).toLocaleString() : '';

      return `
        <div class="p-3 ${isPending ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50 border-stone-200'} border rounded-xl space-y-2.5 transition-all text-xs">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="px-1.5 py-0.5 bg-stone-900 text-white font-mono font-bold text-[9px] rounded">Rm ${task.room_number}</span>
              <span class="ml-1 text-stone-900 font-bold">${task.guest_name}</span>
              <span class="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">${task.issue_category}</span>
            </div>
            <div>
              ${isPending ? `
                <button type="button" data-fo-done-id="${task._id}" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded transition shadow-xs">
                  Close Task
                </button>
              ` : `
                <span class="px-1.5 py-0.5 bg-stone-200 text-stone-600 text-[9px] font-mono font-bold rounded">Resolved</span>
              `}
            </div>
          </div>

          ${task.notes ? `<p class="text-[11px] text-stone-500 bg-white/50 p-1.5 rounded border border-stone-100 italic leading-tight">${task.notes}</p>` : ''}

          <div class="grid grid-cols-2 gap-2 border-t border-stone-100 pt-2 text-[9px] font-mono text-stone-500">
            <div>
              <span class="text-[8px] font-sans font-bold text-stone-400 uppercase tracking-wider block">Logged By:</span>
              <span class="text-stone-700 font-bold">👤 ${task.createdBy}</span>
              <div class="text-[8px] text-stone-400">${createdDate}</div>
            </div>
            <div class="border-l border-stone-200 pl-2">
              <span class="text-[8px] font-sans font-bold text-stone-400 uppercase tracking-wider block">Confirmed By:</span>
              ${!isPending ? `
                <span class="text-emerald-700 font-bold">👤 ${task.completedBy}</span>
                <div class="text-[8px] text-stone-400">${confirmedDate}</div>
              ` : `
                <span class="text-amber-600 italic text-[9px] block pt-0.5 animate-pulse">Pending...</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Process event closures
    tasks.forEach(task => {
      if (task.status === 'pending') {
        const btn = document.querySelector(`[data-fo-done-id="${task._id}"]`);
        if (btn) btn.onclick = () => closeFOTask(task._id);
      }
    });

  } catch (err) {
    console.error("FO engine error stream tracking block error:", err);
  }
}

async function compileDateRangeReport() {
  const start = document.getElementById('fo_report_start').value;
  const end = document.getElementById('fo_report_end').value;

  if (!start || !end) {
    showToast("Please provide both Start and End date limits to run the report.", "error");
    return;
  }

  const titleElement = document.getElementById('fo-view-title');
  const badgeElement = document.getElementById('fo-mode-badge');

  titleElement.innerText = `FO ARCHIVAL ARCHIVE REPORT`;
  badgeElement.className = "px-2 py-0.5 bg-indigo-600 text-white border border-indigo-700 rounded text-[9px] font-bold uppercase tracking-wider";
  badgeElement.innerText = "Custom Audit Filter";

  showToast(`Compiling historical Front Office requests between ${start} and ${end}...`);
  await fetchAndRenderFOData(`?startDate=${start}&endDate=${end}`);
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const room_number = document.getElementById('fo_room').value.trim();
  const guest_name = document.getElementById('fo_guest').value.trim();
  const issue_category = document.getElementById('fo_category').value;
  const notes = document.getElementById('fo_notes').value.trim();

  try {
    const res = await secureFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({ room_number, guest_name, issue_category, notes })
    });

    if (res.ok) {
      showToast("Front Office task dispatched successfully.", "success");
      document.getElementById('fo-task-form').reset();
      refresh();
    } else {
      showToast("Validation check failed.", "error");
    }
  } catch (err) {
    showToast("Network pipeline delivery fault.", "error");
  }
}

async function closeFOTask(taskId) {
  try {
    const res = await secureFetch(`/api/requests/${taskId}/complete`, { method: 'PATCH' });
    if (res.ok) {
      showToast("Front Desk task resolved and stamped.", "success");
      refresh();
    } else {
      showToast("Update authority validation error.", "error");
    }
  } catch (err) {
    showToast("Server trace handshake failure.", "error");
  }
}
