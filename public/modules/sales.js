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
    <h3 class="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">CRM Lead Capture</h3>
    <form id="sales-work-form" class="space-y-3">
      <input type="text" id="s_comp" required placeholder="Company Name" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="text" id="s_cont" required placeholder="Key Contact Person" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="number" id="s_rooms" required placeholder="Total Group Room Block Size" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="number" id="s_rev" required placeholder="Est. Account Value ($)" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <button type="submit" class="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-sm transition">Register Lead Profile</button>
    </form>
  `;

  document.getElementById('sales-work-form').onsubmit = handleFormSubmission;

  viewContainer.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
      <h3 class="text-lg font-black tracking-tight text-stone-900 mb-4">📈 Corporate Accounts Contract Pipeline</h3>
      <div id="sales-live-list" class="space-y-2"></div>
    </div>
  `;
}

export async function refresh() {
  const container = document.getElementById('sales-live-list');
  if (!container) return;

  try {
    const res = await secureFetch('/api/sales/leads');
    const data = await res.json();
    
    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML = `<p class="text-xs text-stone-400 italic py-6 text-center">Pipeline folder empty.</p>`;
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = "p-4 border rounded-xl flex justify-between items-center text-xs bg-stone-50/40 border-stone-200";
      
      div.innerHTML = `
        <div>
          <span class="font-black text-stone-900 block text-sm">${item.company_name}</span>
          <span class="text-stone-500 block font-medium mt-0.5">Contact: ${item.contact_person} • Block Size: ${item.group_rooms_needed} Rooms</span>
          <span class="text-indigo-700 font-bold block mt-1">Value Projection: $${item.revenue_estimation}</span>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider block bg-indigo-50 text-indigo-800 border border-indigo-100">${item.pipeline_stage}</span>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    showToast("Pipeline lead array retrieval fault.", "error");
  }
}

async function handleFormSubmission(e) {
  e.preventDefault();
  const payload = {
    company_name: document.getElementById('s_comp').value.trim(),
    contact_person: document.getElementById('s_cont').value.trim(),
    group_rooms_needed: parseInt(document.getElementById('s_rooms').value),
    revenue_estimation: parseFloat(document.getElementById('s_rev').value)
  };

  const res = await secureFetch('/api/sales/leads', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) {
    showToast("Corporate B2B account file initialized.");
    document.getElementById('sales-work-form').reset();
    refresh();
  }
}
