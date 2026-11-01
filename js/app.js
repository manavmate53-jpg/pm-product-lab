// Core Application Navigation & UI Management for Manav Mate PM Lab

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Handle URL Hash Deep Linking
  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);
});

// Navigation Function
function navigateTo(targetView) {
  const views = ['hub', 'verishield', 'automatch', 'evalguard', 'payrouter', 'flashqueue', 'crewrostering'];
  if (!views.includes(targetView)) {
    targetView = 'hub';
  }

  // Hide all views
  views.forEach(viewId => {
    const el = document.getElementById(`view-${viewId}`);
    if (el) {
      el.classList.add('hidden');
    }

    // Desktop nav buttons
    const navBtn = document.getElementById(`nav-${viewId}`);
    if (navBtn) {
      navBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
      navBtn.classList.add('text-slate-400');
    }
  });

  // Show active view
  const activeEl = document.getElementById(`view-${targetView}`);
  if (activeEl) {
    activeEl.classList.remove('hidden');
    activeEl.classList.add('view-animate');
  }

  // Highlight active desktop tab
  const activeNavBtn = document.getElementById(`nav-${targetView}`);
  if (activeNavBtn) {
    activeNavBtn.classList.remove('text-slate-400');
    activeNavBtn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
  }

  // Update URL hash without forcing jump
  if (window.location.hash !== `#${targetView}`) {
    history.pushState(null, null, `#${targetView}`);
  }

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Re-render Lucide Icons for updated content
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Product specific re-renders on view switch
  if (targetView === 'automatch') {
    if (window.renderDiscoveryWorkspace) window.renderDiscoveryWorkspace();
    setTimeout(() => {
      if (window.initFunnelChart) window.initFunnelChart();
    }, 50);
  }
}

// Handle Hash Navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '').trim();
  if (['hub', 'verishield', 'automatch', 'evalguard', 'payrouter', 'flashqueue', 'crewrostering'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('hub');
  }
}

// Switch between [Live Product View] and [PM Specs & PRD]
function switchProductMode(productKey, mode) {
  const liveContainer = document.getElementById(`${productKey}-live-view`);
  const prdContainer = document.getElementById(`${productKey}-prd-view`);
  const liveBtn = document.getElementById(`${productKey}-btn-live`);
  const prdBtn = document.getElementById(`${productKey}-btn-prd`);

  if (!liveContainer || !prdContainer || !liveBtn || !prdBtn) return;

  if (mode === 'live') {
    liveContainer.classList.remove('hidden');
    prdContainer.classList.add('hidden');
    liveBtn.classList.add('active');
    prdBtn.classList.remove('active');
    showToast(`Switched to Live Product Simulation`, 'info');
  } else if (mode === 'prd') {
    liveContainer.classList.add('hidden');
    prdContainer.classList.remove('hidden');
    liveBtn.classList.remove('active');
    prdBtn.classList.add('active');
    showToast(`Switched to PM Specs & PRD Drawer`, 'info');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Global Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
  } else {
    iconSvg = '<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }

  toast.innerHTML = `
    <div class="flex-shrink-0">${iconSvg}</div>
    <div class="flex-1 font-medium text-xs sm:text-sm text-slate-200">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger animation frame
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-dismiss after 3.2s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

// Expose globally
window.navigateTo = navigateTo;
window.switchProductMode = switchProductMode;
window.showToast = showToast;
