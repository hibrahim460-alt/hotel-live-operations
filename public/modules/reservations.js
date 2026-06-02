import { secureFetch, showToast } from '../app.js';
let formContainer, viewContainer;

export function init(formElement, viewElement) { formContainer = formElement; viewContainer = viewElement; renderWorkspaceLayout(); refresh(); }

function renderWorkspaceLayout() {
  formContainer.innerHTML = `
    <form id="res-work-form" class="space-y-2 text-stone-800">
      <input type="text" id="res_guest" required placeholder="Guest full name" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="text" id="res_room" required placeholder="Target allocation room" class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <input type="date" id="res_date" required class="w-full p-2 border text-xs rounded-lg focus:outline-none">
      <select id="res_vip" class="w-full p-2 border text-xs rounded-lg focus:outline-none"><option value="Standard">Standard Allocation</option><option value="VIP">⭐ VIP Executive Tier</option><option value="VVVIP">👑 Crown Suite Protocol</option></select>
      <select id="res_setup" class="w-full p-2 border text-xs rounded-lg focus:outline-none"><option value="">No pre-arrival task triggers</option><option value="add Baby-Crib ">Deploy Baby-Crib</option><option value="add-Extra Bed">Deploy Rollaway Bed</option></select>
      <button type="submit" class="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg">Lock Booking</button>
    </form>
  `;
  document.getElementById('res-work-form').onsubmit = handleFormSubmission;
  viewContainer.innerHTML = `<div id="res-live-list" class="grid grid-cols-1 gap-2 text-xs"></div>`;
}

export async function refresh() {
  const container = document.getElementById('res-live-list'); if (!container) return;
  try {
    const res = await secureFetch('/api/reservations'); const data = await res.json();
    container.innerHTML = data.length === 0 ? '<p class="italic text-stone-400 py-4 text-center">No guest bookings registered on file index counters.</p>' : '';
    data.forEach(item => {
      const div = document.createElement('div'); div.className = `p-2.5 border rounded-xl flex justify-between items-center ${item.vip_tier!=='Standard'?'bg-amber-50/40 border-amber-200/60':'bg-stone-50/40'}`;
      div.innerHTML = `<div><span class="font-black text-stone-900">${item.guest_name}</span><p class="text-stone-500 text-[10px] mt-0.5">Room ${item.room_number} • Target Arrival: ${item.arrival_date}</p>
        ${item.special_amenities?`<span class="inline-block mt-1 px-1 bg-stone-900 text-white font-mono text-[8px] uppercase tracking-wide rounded">Auto-Task: ${item.special_amenities}</span>`:''}</div>
        <span class="text-[9px] font-black uppercase tracking-wider">${item.vip_tier}</span>`;
      container.appendChild(div);
    });
  } catch(e){}
}

async function handleFormSubmission(e) {
  e.preventDefault();
  const payload = { guest_name: document.getElementById('res_guest').value.trim(), room_number: document.getElementById('res_room').value.trim(), arrival_date: document.getElementById('res_date').value, vip_tier: document.getElementById('res_vip').value, special_amenities: document.getElementById('res_setup').value };
  const res = await secureFetch('/api/reservations', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) { showToast("Booking finalized. Pre-arrival operational queues populated."); document.getElementById('res-work-form').reset(); refresh(); }
}
