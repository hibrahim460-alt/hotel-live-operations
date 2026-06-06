import * as AdminModule from './modules/admin.js';
import * as BiModule from './modules/bi.js';

// Secure Fetch token handling wrapper
export async function secureFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Auto-inject authorization if present in localstorage
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return await fetch(url, { ...options, headers });
}

export function showToast(message, type = 'success') {
  console.log(`[SYSTEM TOAST - ${type.toUpperCase()}]: ${message}`);
}

document.addEventListener('DOMContentLoaded', () => {
  const formSlot = document.getElementById('app-form-slot');
  const viewSlot = document.getElementById('app-view-slot');
  
  const navAdmin = document.getElementById('nav-admin');
  const navBi = document.getElementById('nav-bi');
  
  if (!formSlot || !viewSlot) {
    console.error('❌ UI Frame Error: Target DOM initialization slots are missing.');
    return;
  }

  // View Routing Management
  function switchWorkspace(target) {
    // UI state active toggles
    if (target === 'admin') {
      navAdmin.classList.add('bg-stone-800', 'text-white');
      navBi.classList.remove('bg-stone-800', 'text-white');
      AdminModule.init(formSlot, viewSlot);
    } else if (target === 'bi') {
      navBi.classList.add('bg-stone-800', 'text-white');
      navAdmin.classList.remove('bg-stone-800', 'text-white');
      BiModule.init(formSlot, viewSlot);
    }
  }

  // Hook navigation buttons
  navAdmin.onclick = () => switchWorkspace('admin');
  navBi.onclick = () => switchWorkspace('bi');

  // Bootstrapping Default view
  switchWorkspace('admin');
  console.log('🏁 Core UI Workspace layout initialized to Version 1.1 baseline stability.');
});
