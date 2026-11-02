// Navigation & Global UI Management
// Clean, minimalist event routing with zero framework overhead

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);
});

function navigateTo(targetView) {
  const views = ['hub', 'verishield', 'automatch', 'evalguard', 'payrouter', 'flashqueue', 'crewrostering'];
  if (!views.includes(targetView)) {
    targetView = 'hub';
  }

  views.forEach(viewId => {
    const el = document.getElementById(`view-${viewId}`);
    if (el) el.classList.add('hidden');

    const navBtn = document.getElementById(`nav-${viewId}`);
    if (navBtn) navBtn.classList.remove('active');

    const mobileBtn = document.getElementById(`mobile-nav-${viewId}`);
    if (mobileBtn) mobileBtn.classList.remove('active');
  });

  const activeEl = document.getElementById(`view-${targetView}`);
  if (activeEl) activeEl.classList.remove('hidden');

  const activeNavBtn = document.getElementById(`nav-${targetView}`);
  if (activeNavBtn) activeNavBtn.classList.add('active');

  const activeMobileBtn = document.getElementById(`mobile-nav-${targetView}`);
  if (activeMobileBtn) activeMobileBtn.classList.add('active');

  if (window.location.hash !== `#${targetView}`) {
    history.pushState(null, null, `#${targetView}`);
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (targetView === 'automatch') {
    if (window.renderDiscoveryWorkspace) window.renderDiscoveryWorkspace();
    setTimeout(() => {
      if (window.initFunnelChart) window.initFunnelChart();
    }, 40);
  }
}

function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '').trim();
  const valid = ['hub', 'verishield', 'automatch', 'evalguard', 'payrouter', 'flashqueue', 'crewrostering'];
  navigateTo(valid.includes(hash) ? hash : 'hub');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';

  const badgeClass = type === 'success' ? 'chip-ok' : (type === 'error' ? 'chip-bad' : 'chip-cool');

  toast.innerHTML = `
    <span class="chip ${badgeClass}">${type.toUpperCase()}</span>
    <span class="text-xs font-mono">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 2800);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.navigateTo = navigateTo;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
