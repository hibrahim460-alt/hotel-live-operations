// =========================================================================
// WH ERP CORE RUNTIME CONTROLLER - VERSION 1.1 RESTORED & ALIGNED
// =========================================================================

// FIXED: Adjusted to a relative directory resolution structure
import * as AdminModule from './modules/admin.js';

// Secure Fetch abstraction framework utility wrapper
export async function secureFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(url, { ...options, headers });
  return response;
}

// Global System Notification Banner Trigger
export function showToast(message, type = 'success') {
  console.log(`[SYSTEM TOAST - ${type.toUpperCase()}]: ${message}`);
}

// App bootstrapping framework initialization loop
document.addEventListener('DOMContentLoaded', () => {
  const formSlot = document.getElementById('app-form-slot');
  const viewSlot = document.getElementById('app-view-slot');
  
  if (formSlot && viewSlot) {
    AdminModule.init(formSlot, viewSlot);
    console.log('🏁 Core UI Workspace layout initialized to Version 1.1 baseline stability.');
  } else {
    console.error('❌ UI Frame Error: Target DOM initialization slots are missing.');
  }
});
