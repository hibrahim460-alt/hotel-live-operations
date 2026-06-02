import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) { formContainer = formElement; viewContainer = viewElement; renderWorkspaceLayout(); refresh(); }

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <div class="space-y-3">
      <div><h3 class="text-indigo-600 text-xs font-black uppercase tracking-wider">📊 Analytics Core</h3><p class="text-[10px] text-stone-400 leading-snug">Continuous mathematical tracking engine providing high-level operational breakdowns.</p></div>
      <button id="btn-bi-refresh" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition">Recalculate Run-Rates</button>
    </div>
  `;
  document.getElementById('btn-bi-refresh').onclick = refresh;
  viewContainer.innerHTML = `
    <div class="space-y-4 text-stone-900">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-stone-50 p-2.5 rounded-xl border"><span class="text-[9px] uppercase font-bold text-stone-400 block">Ops Load</span><span id="bi-ops-load" class="text-lg font-black block mt-0.5">0</span></div>
        <div class="bg-stone-50 p-2.5 rounded-xl border"><span class="text-[9px] uppercase font-bold text-stone-400 block">Dispute Value</span><span id="bi-fin-risk" class="text-lg font-black text-rose-600 block mt-0.5">$0</span></div>
        <div class="bg-stone-50 p-2.5 rounded-xl border"><span class="text-[9px] uppercase font-bold text-stone-400 block">CRM Pipeline</span><span id="bi-sales-pipe" class="text-lg font-black text-indigo-600 block mt-0.5">$0</span></div>
        <div class="bg-stone-50 p-2.5 rounded-xl border"><span class="text-[9px] uppercase font-bold text-stone-400 block">VIP Density</span><span id="bi-vip-depth" class="text-lg font-black text-amber-500 block mt-0.5">0%</span></div>
      </div>
      <div class="space-y-2 text-[10px] font-mono text-stone-300">
        <div class="p-2.5 bg-stone-900 rounded-xl"><h5 class="text-[8px] font-sans font-bold text-stone-400 uppercase tracking-wider mb-1.5 border-b border-stone-800 pb-0.5">Sales Pipeline</h5><div id="bi-sales-list" class="space-y-1"></div></div>
        <div class="p-2.5 bg-stone-900 rounded-xl"><h5 class="text-[8px] font-sans font-bold text-stone-400 uppercase tracking-wider mb-1.5 border-b border-stone-800 pb-0.5">Ops Mix</h5><div id="bi-ops-mix" class="space-y-1"></div></div>
      </div>
    </div>
  `;
}

export async function refresh() {
  try {
    const res = await secureFetch('/api/bi/analytics'); const data = await res.json(); if (!res.ok) return;
    document.getElementById('bi-ops-load').innerText = data.operations.total;
    const finSum = data.finance.find(f => f._id === 'pending_review')?.totalValue || 0;
    document.getElementById('bi-fin-risk').innerText = `$${finSum.toLocaleString()}`;
    const saleSum = data.sales.reduce((acc, s) => acc + s.projectedRevenue, 0);
    document.getElementById('bi-sales-pipe').innerText = `$${saleSum.toLocaleString()}`;
    const vipRatio = data.bookings.total > 0 ? Math.round((data.bookings.vipCount / data.bookings.total) * 100) : 0;
    document.getElementById('bi-vip-depth').innerText = `${vipRatio}%`;

    document.getElementById('bi-sales-list').innerHTML = data.sales.map(s => `<div class="flex justify-between"><span>${s._id}</span><span class="text-indigo-400 font-bold">$${s.projectedRevenue.toLocaleString()}</span></div>`).join('') || '<span class="italic text-stone-600">No leads tracking</span>';
    document.getElementById('bi-ops-mix').innerHTML = data.operations.breakdown.map(c => `<div class="flex justify-between"><span>${c._id}</span><span class="text-amber-400 font-bold">${c.count} codes</span></div>`).join('') || '<span class="italic text-stone-600">No operations active</span>';
  } catch(e){}
}
