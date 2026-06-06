// =========================================================================
// VERIFIED PWA INSTALLATION KERNEL
// =========================================================================

// Global variable to hold the installation prompt event
let persistentInstallPrompt = null;

// Capture the installation event at the earliest possible lifecycle moment
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent mobile browsers from automatically showing native bottom sheets
  e.preventDefault();
  
  // Stash the event so it can be triggered via our button layout later
  persistentInstallPrompt = e;
  
  console.log('🔄 PWA Installation criteria verified by host browser. Prompt cached.');
  
  // Attempt to expose the button if the DOM is already drawn
  evaluateInstallButtonVisibility();
});

// Register the Service Worker immediately to fulfill browser installation criteria
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('⚙️ Service Worker trace attached successfully:', reg.scope))
      .catch(err => console.error('❌ Service Worker registration failure:', err));
  });
}

// Safely evaluate button state and attach triggers once the DOM matches memory state
document.addEventListener('DOMContentLoaded', () => {
  evaluateInstallButtonVisibility();
  setupInstallButtonClickHandler();
});

function evaluateInstallButtonVisibility() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn && persistentInstallPrompt) {
    installBtn.classList.remove('hidden');
    installBtn.classList.add('flex');
    console.log('👁️ UI Layout Updated: Installation button exposed.');
  }
}

function setupInstallButtonClickHandler() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (!installBtn) return;

  // Re-assign explicitly to overwrite duplicate event listener bubbles
  installBtn.onclick = async () => {
    if (!persistentInstallPrompt) {
      console.warn('❌ Installation event missing or already spent.');
      return;
    }
    
    try {
      // Trigger the native browser overlay prompt sequence
      await persistentInstallPrompt.prompt();
      
      // Await the explicit user confirmation choice
      const { outcome } = await persistentInstallPrompt.userChoice;
      console.log(`👤 User install prompt outcome: ${outcome}`);
      
    } catch (err) {
      console.error('⚠️ Critical failure during prompt execution stream:', err);
    } finally {
      // Clean up variables to prevent memory leaks and hide the element gracefully
      persistentInstallPrompt = null;
      installBtn.classList.remove('flex');
      installBtn.classList.add('hidden');
    }
  };
}

// Handle layout cleaning if the user installs the app directly via browser chrome bars
window.addEventListener('appinstalled', () => {
  console.log('🎉 Application initialized successfully as standalone instance.');
  persistentInstallPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.classList.remove('flex');
    installBtn.classList.add('hidden');
  }
});
