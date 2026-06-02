import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) { formContainer = formElement; viewContainer = viewElement; renderWorkspaceLayout(); refresh(); }

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <form id="acc-work-form" class="space-y-2 text-stone-800">
      <input type="text" id="acc_room" required placeholder="Room index" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="number" id="acc_amt" required placeholder="Disputed amount value ($)" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <textarea id="acc_reason" required placeholder="Audit reason anomaly context..." class="w-full p-2 border text-xs rounded-lg h-12 focus:outline-none"></textarea>
      <button type="submit" class="w-full py-2 bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg shadow-xs">Log Balance Dispute</button>
    </form>
  `;
  document.getElementById('acc-work-form').onsubmit = handleFormSubmission;
  viewContainer.innerHTML = `<div class="overflow-x-auto border rounded-xl"><table class="w-full text-left text-xs"><thead class="bg-stone-50 font-bold uppercase text-[9px] text-stone-400 border-b"><tr><th class="p-2">Room</th><th class="p-2">Disputed</th><th class="p-2">Reason</th><th class="p-2 text-right">Status</th></tr></thead><tbody id="acc-table-rows" class="divide-y text-stone-700"></tbody></table></div>`;
}

export async function refresh() {
  const tbody = document.getElementById('acc-table-rows'); if (!tbody) return;
  try {
    const res = await secureFetch('/api/accounting/disputes'); const data = await res.json();
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="4" class="p-3 text-center text-stone-400 italic">No balance variances open.</td></tr>' : '';
    data.forEach(item => {
      const tr = document.createElement('tr'); tr.innerHTML = `<td class="p-2 font-bold">Rm ${item.room_number}</td><td class="p-2 font-semibold text-rose-600">$${item.disputed_amount}</td><td class="p-2 text-stone-400 max-w-[120px] truncate" title="${item.reason}">${item.reason}</td><td class="p-2 text-right"><span class="px-1 text-[8px] font-black uppercase rounded ${item.status==='approved'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}">${item.status==='approved'?'Cleared':'Pending'}</span></td>`;
      tbody.appendChild(tr);
    });
  } catch(e){}
}

async function handleFormSubmission(e) {
  e.preventDefault();
  const payload = { room_number: document.getElementById('acc_room').value.trim(), disputed_amount: parseFloat(document.getElementById('acc_amt').value), reason: document.getElementById('acc_reason').value.trim() };
  const res = await secureFetch('/api/accounting/disputes', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) { showToast("Financial dispute routed directly to management audit logs."); document.getElementById('acc-work-form').reset(); refresh(); }
}
