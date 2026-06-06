// =========================================================================
// VERIFIED PWA INSTALLATION INTERACTION KERNEL (REGRESSION PROTECTED)
// =========================================================================

// Global variable allocated to protect the reference window event token instance
let persistentInstallPrompt = null;

// Rule 1: Immediately intercept the browser installation prompt token
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent older platforms from throwing automatic non-styled layout overlays
  e.preventDefault();
  
  // Cache the execution pipeline event securely
  persistentInstallPrompt = e;
  
  console.log('🔄 PWA Installation criteria verified by host browser. Prompt cached.');
  
  // Attempt to expose button if layout painting processes are completed
  evaluateInstallButtonVisibility();
});

// Rule 2: Register background service workers immediately to fulfill strict offline support checks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('⚙️ Service Worker channel attached successfully to runtime domain scope:', reg.scope))
      .catch(err => console.error('❌ Service Worker subsystem initialization structural fault:', err));
  });
}

// Rule 3: Bind structural listeners safely when document assets finish memory loading cycles
document.addEventListener('DOMContentLoaded', () => {
  evaluateInstallButtonVisibility();
  setupInstallButtonClickHandler();
});

/**
 * Validates variables and handles swapping visibility utility tags natively
 */
function evaluateInstallButtonVisibility() {
  try {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn && persistentInstallPrompt) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('flex');
      console.log('👁️ UI Layout Framework Mapping: Installation anchor exposed to operator.');
    }
  } catch (err) {
    console.error('Non-critical evaluation interruption caught safely:', err);
  }
}

/**
 * Handles clearing bubble traces and executing core browser native installation sequences
 */
function setupInstallButtonClickHandler() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (!installBtn) return;

  // Enforce precise listener bindings to prevent nested trigger thread bubbles
  installBtn.onclick = async () => {
    if (!persistentInstallPrompt) {
      console.warn('❌ Interaction request blocked: Installation event reference stack empty.');
      return;
    }
    
    try {
      // Fire browser platform overlay system
      await persistentInstallPrompt.prompt();
      
      // Await confirmation metrics selection choice
      const { outcome } = await persistentInstallPrompt.userChoice;
      console.log(`👤 System administrator profile prompt validation choice outcome: ${outcome}`);
      
    } catch (err) {
      console.error('⚠️ Critical internal fault during native prompt overlay evaluation:', err);
    } finally {
      // Clear event references to prevent multi-call execution blocks
      persistentInstallPrompt = null;
      installBtn.classList.remove('flex');
      installBtn.classList.add('hidden');
    }
  };
}

/**
 * Fallback loop listener: Safely hides the layout buttons if the user triggers install from browser url bars
 */
window.addEventListener('appinstalled', () => {
  console.log('🎉 ERP Core Application environment registered successfully as isolated standalone local framework.');
  persistentInstallPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.classList.remove('flex');
    installBtn.classList.add('hidden');
  }
});

// =========================================================================
// STANDARD MODULE INJECTIONS
// =========================================================================
import * as AdminModule from './modules/admin.js';
if (document.getElementById('app-form-slot')) {
  AdminModule.init(document.getElementById('app-form-slot'), document.getElementById('app-view-slot'));
}
