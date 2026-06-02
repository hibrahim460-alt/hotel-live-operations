import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) {
  formContainer = formElement;
  viewContainer = viewElement;
  renderWorkspaceLayout();
  refresh();
}

function renderWorkspaceLayout() {
  // PANEL A: Input Controls Container (Task Insertion + Isolated Date Filtering)
  formContainer.innerHTML = `
    <div class="space-y-5 text-stone-900">
      <div>
        <h3 class="text-indigo-600 text-xs font-black uppercase tracking-wider">🛎️ FO Management Controls</h3>
        <p class="text-[10px] text-stone-400 mt-0.5 leading-tight">Create real-time work requests or extract isolated, clean transaction logs below.</p>
      </div>
      
      <form id="fo-task-form" class="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200 shadow-xs">
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
          Dispatch Live Task
        </button>
      </form>

      <div class="bg-stone-900 text-white p-3 rounded-xl space-y-2 border border-stone-800 shadow-sm">
        <span class="text-[9px] uppercase font-black tracking-wider text-indigo-400 block">📊 FO Historical Log Engine</span>
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
          <button type="button" id="btn-fo-run-report" class="py-1.5 bg-indigo-500 hover:bg-indigo-600 text-stone-950 font-black text-[9px] uppercase tracking-wider rounded transition-all">
            Compile Report
          </button>
          <button type="button" id="btn-fo-clear-report" class="py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[9px] uppercase tracking-wider rounded transition-all">
            Clear Results
          </button>
        </div>
      </div>
    </div>
  `;

  // PANEL B: Re-engineered Viewport Matrix splitting Live views and Report outputs permanently
  viewContainer.innerHTML = `
    <div class="space-y-6">
      
      <div class="space-y-2">
        <div class="flex justify-between items-center border-b border-stone-200 pb-1.5">
          <h4 class="text-stone-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Active Front Desk Queue
          </h4>
          <span class="px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded text-[9px] font-mono font-bold">Auto-Syncing</span>
        </div>
        <div id="fo-live-queue-target" class="space-y-2 max-h-[300px] overflow-y-auto pr-1"></div>
      </div>

      <div id="fo-report-vault-container" class="space-y-2 border-t border-stone-200 pt-4 hidden">
        <div class="flex justify-between items-center border-b border-stone-200 pb-1.5">
          <h4 id="fo-report-vault-title" class="text-indigo-600 text-xs font-black uppercase tracking-wider">
            🧾 Compiled Date Range Audit Logs
          </h4>
          <span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-mono font-bold uppercase tracking-wide">Report Output</span>
        </div>
        <div id="fo-compiled-report-target" class="space-y-2 max-h-[350px] overflow-y-auto pr-1"></div>
      </div>

    </div>
  `;

  document.getElementById('fo-task-form').onsubmit = handleTaskSubmit;
  document.getElementById('btn-fo-run-report').onclick = compileDateRangeReport;
  document.getElementById('btn-fo-clear-report').onclick = clearReportVaultView;
}

export async function refresh() {
  // Pull live data safely without touching or resetting any generated historical audit reports
  await fetchAndRenderLiveQueue();
}

// 1. Manages and renders the isolated, real-time streaming view list
async function fetchAndRenderLiveQueue() {
  const container = document.getElementById('fo-live-queue-target');
  if (!container) return;

  try {
    const res = await secureFetch('/api/requests/today');
    const tasks = await res.json();

    if (tasks.length === 0) {
      container.innerHTML = `<div class="p-3 text-center italic text-stone-400 text-xs bg-stone-50/50 rounded-xl border border-dashed">No active operational tasks pending.</div>`;
      return;
    }

    container.innerHTML = tasks.map(task => {
      const isPending = task.status === 'pending';
      const createdDate = new Date(task.timestamp).toLocaleString();
      const confirmedDate = task.completedAt ? new Date(task.completedAt).toLocaleString() : '';

      return `
        <div class="p-3 ${isPending ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50 border-stone-200'} border rounded-xl space-y-2 text-xs">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="px-1.5 py-0.5 bg-stone-900 text-white font-mono font-bold text-[9px] rounded">Rm ${task.room_number}</span>
              <span class="ml-1 text-stone-900 font-bold">${task.guest_name}</span>
              <span class="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">${task.issue_category}</span>
            </div>
            <div>
              ${isPending ? `
                <button type="button" data-fo-live-done-id="${task._id}" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded transition">
                  Resolve
                </button>
              ` : `
                <span class="px-1.5 py-0.5 bg-stone-200 text-stone-500 text-[9px] font-mono font-bold rounded">Closed</span>
              `}
            </div>
          </div>

          ${task.notes ? `<p class="text-[11px] text-stone-500 bg-white/50 p-1.5 rounded border border-stone-100 italic leading-tight">${task.notes}</p>` : ''}

          <div class="grid grid-cols-2 gap-2 border-t border-stone-100 pt-2 text-[8px] font-mono text-stone-400">
            <div>
              <span class="font-bold text-stone-500 uppercase tracking-wider block">Created:</span>
              <span class="text-stone-700">👤 ${task.createdBy}</span>
              <div>${createdDate}</div>
            </div>
            <div class="border-l border-stone-200/80 pl-2">
              <span class="font-bold text-stone-500 uppercase tracking-wider block">Resolved:</span>
              ${!isPending ? `<span class="text-emerald-700 font-bold">👤 ${task.completedBy}</span><div>${confirmedDate}</div>` : `<span class="text-amber-600 italic">In Queue</span>`}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Dynamically bind live task event listeners
    tasks.forEach(task => {
      if (task.status === 'pending') {
        const btn = document.querySelector(`[data-fo-live-done-id="${task._id}"]`);
        if (btn) btn.onclick = () => closeFrontOfficeTask(task._id);
      }
    });

  } catch (err) {
    console.error("Live view compilation failed:", err);
  }
}

// 2. Compiles historical log requests and renders them inside the separate vault section
async function compileDateRangeReport() {
  const start = document.getElementById('fo_report_start').value;
  const end = document.getElementById('fo_report_end').value;

  if (!start || !end) {
    showToast("Please provide both Start and End date bounds to compile an isolated report.", "error");
    return;
  }

  const vaultContainer = document.getElementById('fo-report-vault-container');
  const reportTarget = document.getElementById('fo-compiled-report-target');
  const vaultTitle = document.getElementById('fo-report-vault-title');

  try {
    const res = await secureFetch(`/api/requests/today?startDate=${start}&endDate=${end}`);
    const reports = await res.json();

    vaultTitle.innerText = `🧾 Audit Report Ledger: ${start} to ${end}`;
    vaultContainer.classList.remove('hidden'); // Reveal the separated data viewport

    if (reports.length === 0) {
      reportTarget.innerHTML = `<div class="p-4 text-center italic text-stone-400 text-xs bg-stone-50 rounded-xl border border-dashed">No archival signatures logged inside this explicit date constraint range.</div>`;
      return;
    }

    reportTarget.innerHTML = reports.map(task => {
      const createdDate = new Date(task.timestamp).toLocaleString();
      const confirmedDate = task.completedAt ? new Date(task.completedAt).toLocaleString() : '';

      return `
        <div class="p-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-1.5 text-xs">
          <div class="flex justify-between items-center">
            <div>
              <span class="px-1 bg-stone-900 text-white font-mono text-[9px] rounded">Rm ${task.room_number}</span>
              <span class="ml-1 text-stone-900 font-bold">${task.guest_name}</span>
            </div>
            <span class="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-mono ${task.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'} font-bold">
              ${task.status}
            </span>
          </div>
          
          <div class="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">${task.issue_category}</div>
          ${task.notes ? `<p class="text-[10px] text-stone-600 bg-white/80 p-1 rounded border border-stone-100 italic">${task.notes}</p>` : ''}

          <div class="grid grid-cols-2 gap-2 border-t border-indigo-100/60 pt-1.5 text-[8px] font-mono text-stone-400">
            <div>
              <span class="text-stone-500 uppercase font-bold block">Creator Sign:</span>
              <span class="text-stone-700">👤 ${task.createdBy}</span>
              <div>${createdDate}</div>
            </div>
            <div class="border-l border-indigo-100 pl-1.5">
              <span class="text-stone-500 uppercase font-bold block">Completer Sign:</span>
              ${task.completedAt ? `<span class="text-emerald-700 font-bold">👤 ${task.completedBy}</span><div>${confirmedDate}</div>` : `<span class="text-amber-600 italic">Unresolved</span>`}
            </div>
          </div>
        </div>
      `;
    }).join('');

    showToast(`Compiled report with ${reports.length} historical entries successfully.`, "success");
  } catch (err) {
    showToast("Error extracting historical records context.", "error");
  }
}

function clearReportVaultView() {
  document.getElementById('fo_report_start').value = '';
  document.getElementById('fo_report_end').value = '';
  document.getElementById('fo-report-vault-container').classList.add('hidden');
  document.getElementById('fo-compiled-report-target').innerHTML = '';
  showToast("Report historical view cleared.");
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
      showToast("Task dispatched securely.", "success");
      document.getElementById('fo-task-form').reset();
      refresh();
    } else {
      showToast("Task parsing fields rejected.", "error");
    }
  } catch (err) {
    showToast("Network delivery failure.", "error");
  }
}

async function closeFrontOfficeTask(taskId) {
  try {
    const res = await secureFetch(`/api/requests/${taskId}/complete`, { method: 'PATCH' });
    if (res.ok) {
      showToast("Front Desk task marked resolved.", "success");
      refresh();
    } else {
      showToast("Failed to authorize sign-off update.", "error");
    }
  } catch (err) {
    showToast("Handshake processing connection fault.", "error");
  }
}
