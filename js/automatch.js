// Product 2: AutoMatch Marketplace Matching & Funnel Telemetry
// Deterministic recommendation scoring, experimentation cohorts, and conversion funnel telemetry

let amVehicles = [];
let amCurrentMode = 'quiz';
let amQuizState = { maxBudget: 16, bodyType: 'all', usage: 'commute' };
let amFilterState = { maxPrice: 20, fuel: 'all', transmission: 'all' };

let amFunnelMetrics = {
  impressions: 1420,
  quizCompleted: 580,
  views: 312,
  leads: 84
};

let amTelemetryLogs = [];

document.addEventListener('DOMContentLoaded', () => {
  initAutoMatch();
});

function initAutoMatch() {
  if (window.LabData && window.LabData.vehicles && window.LabData.vehicles.vehicles) {
    amVehicles = window.LabData.vehicles.vehicles;
  }
  setupAmListeners();
  renderDiscoveryWorkspace();
  logAmTelemetry("session_init", { cohort: "Variant_B_Smart_Quiz", inventory_count: amVehicles.length });
}

function setupAmListeners() {
  const quizBudget = document.getElementById('quiz-budget-slider');
  if (quizBudget) {
    quizBudget.addEventListener('input', (e) => {
      amQuizState.maxBudget = parseFloat(e.target.value);
      const valEl = document.getElementById('quiz-budget-val');
      if (valEl) valEl.textContent = `₹${amQuizState.maxBudget.toFixed(1)} L`;
      renderDiscoveryWorkspace();
    });
  }

  const legacyPrice = document.getElementById('filter-price-slider');
  if (legacyPrice) {
    legacyPrice.addEventListener('input', (e) => {
      amFilterState.maxPrice = parseFloat(e.target.value);
      const valEl = document.getElementById('filter-price-val');
      if (valEl) valEl.textContent = `₹${amFilterState.maxPrice.toFixed(1)} L`;
      renderDiscoveryWorkspace();
    });
  }

  const legacyFuel = document.getElementById('filter-fuel');
  if (legacyFuel) {
    legacyFuel.addEventListener('change', (e) => {
      amFilterState.fuel = e.target.value;
      renderDiscoveryWorkspace();
    });
  }

  const legacyTrans = document.getElementById('filter-transmission');
  if (legacyTrans) {
    legacyTrans.addEventListener('change', (e) => {
      amFilterState.transmission = e.target.value;
      renderDiscoveryWorkspace();
    });
  }
}

function setMarketplaceMode(mode) {
  amCurrentMode = mode;
  const btnQuiz = document.getElementById('btn-mode-quiz');
  const btnLegacy = document.getElementById('btn-mode-legacy');
  const containerQuiz = document.getElementById('container-quiz-mode');
  const containerLegacy = document.getElementById('container-legacy-mode');

  if (mode === 'quiz') {
    if (btnQuiz) btnQuiz.classList.add('active');
    if (btnLegacy) btnLegacy.classList.remove('active');
    if (containerQuiz) containerQuiz.classList.remove('hidden');
    if (containerLegacy) containerLegacy.classList.add('hidden');
    logAmTelemetry("cohort_switched", { cohort: "Variant_B_Smart_Quiz" });
    if (window.showToast) window.showToast("Switched to Variant B: Smart 3-Step Matcher", "info");
  } else {
    if (btnLegacy) btnLegacy.classList.add('active');
    if (btnQuiz) btnQuiz.classList.remove('active');
    if (containerLegacy) containerLegacy.classList.remove('hidden');
    if (containerQuiz) containerQuiz.classList.add('hidden');
    logAmTelemetry("cohort_switched", { cohort: "Control_Legacy_Filters" });
    if (window.showToast) window.showToast("Switched to Control: Granular Filters", "info");
  }

  renderDiscoveryWorkspace();
}

function setQuizBodyType(type) {
  amQuizState.bodyType = type;
  ['all', 'suv', 'sedan', 'hatchback'].forEach(t => {
    const btn = document.getElementById(`btn-body-${t}`);
    if (btn) {
      if (t === type) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  amFunnelMetrics.quizCompleted += 1;
  updateAmFunnelUI();
  logAmTelemetry("quiz_step_completed", { step: "body_type", value: type });
  renderDiscoveryWorkspace();
}

function setQuizUsage(usage) {
  amQuizState.usage = usage;
  ['commute', 'family', 'highway'].forEach(u => {
    const btn = document.getElementById(`btn-usage-${u}`);
    if (btn) {
      if (u === usage) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  logAmTelemetry("quiz_step_completed", { step: "usage", value: usage });
  renderDiscoveryWorkspace();
}

function renderDiscoveryWorkspace() {
  const container = document.getElementById('marketplace-inventory-grid');
  if (!container) return;

  let scored = amVehicles.map(v => {
    let score = 70;
    if (amCurrentMode === 'quiz') {
      if (v.priceLakh <= amQuizState.maxBudget) score += 20;
      else score -= Math.min(30, Math.round((v.priceLakh - amQuizState.maxBudget) * 5));

      if (amQuizState.bodyType !== 'all') {
        const matchesBody = v.bestFor.toLowerCase().includes(amQuizState.bodyType) || v.model.toLowerCase().includes(amQuizState.bodyType);
        score += matchesBody ? 10 : -10;
      }
    } else {
      if (v.priceLakh <= amFilterState.maxPrice) score += 15;
      else score -= 25;

      if (amFilterState.fuel !== 'all' && v.fuel.toLowerCase() !== amFilterState.fuel.toLowerCase()) score -= 30;
      if (amFilterState.transmission !== 'all' && !v.transmission.toLowerCase().includes(amFilterState.transmission.toLowerCase())) score -= 30;
    }

    return { ...v, matchScore: Math.max(10, Math.min(99, score)) };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  container.innerHTML = scored.map(v => `
    <div class="panel p-4 flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-sm font-medium text-ink">${escapeHtml(v.make)} ${escapeHtml(v.model)}</h3>
            <p class="text-xs text-muted mt-0.5">${v.year} · ${escapeHtml(v.location)}</p>
          </div>
          <span class="chip ${v.matchScore >= 80 ? 'chip-ok' : 'chip-cool'}">${v.matchScore}% Match</span>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-muted">
          <div>Price: <strong class="text-ink">${v.priceFormatted}</strong></div>
          <div>Fuel: <strong class="text-ink">${v.fuel}</strong></div>
          <div>Transmission: <strong class="text-ink">${v.transmission}</strong></div>
          <div>Inspection: <strong class="text-ok">${v.inspectionScore}/10</strong></div>
        </div>

        <div class="mt-3 p-2 bg-paper-3 rounded border border-rule text-xs text-ink-2">
          3-Yr Est TCO: <span class="text-ink font-mono font-medium">₹${v.estimated3YrTCO} Lakh</span>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-rule flex items-center justify-between">
        <span class="text-xs text-muted">${v.bestFor}</span>
        <button onclick="bookCarInquiry('${v.id}', '${v.make} ${v.model}')" class="btn btn-quiet text-xs">
          Schedule Inspection
        </button>
      </div>
    </div>
  `).join('');
}

function bookCarInquiry(carId, carName) {
  amFunnelMetrics.views += 1;
  amFunnelMetrics.leads += 1;
  updateAmFunnelUI();

  logAmTelemetry("lead_submitted", { vehicle_id: carId, vehicle_name: carName, lead_id: "lead_" + Math.floor(1000 + Math.random() * 9000) });
  if (window.showToast) window.showToast(`Inspection request registered for ${carName}`, "success");
}

function updateAmFunnelUI() {
  const impEl = document.getElementById('funnel-metric-impressions');
  const quizEl = document.getElementById('funnel-metric-quiz');
  const viewEl = document.getElementById('funnel-metric-views');
  const leadEl = document.getElementById('funnel-metric-leads');

  if (impEl) impEl.textContent = amFunnelMetrics.impressions.toLocaleString('en-IN');
  if (quizEl) quizEl.textContent = amFunnelMetrics.quizCompleted.toLocaleString('en-IN');
  if (viewEl) viewEl.textContent = amFunnelMetrics.views.toLocaleString('en-IN');
  if (leadEl) leadEl.textContent = amFunnelMetrics.leads.toLocaleString('en-IN');
}

function logAmTelemetry(eventType, data) {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    event: eventType,
    payload: data
  };
  amTelemetryLogs.unshift(entry);

  const container = document.getElementById('marketplace-telemetry-log');
  if (!container) return;

  container.innerHTML = amTelemetryLogs.slice(0, 5).map(l => `
    <div class="flex items-start gap-2 py-1.5 border-b border-rule font-mono text-xs">
      <span class="text-muted w-16">${l.timestamp}</span>
      <span class="chip chip-cool">${l.event}</span>
      <span class="text-ink-2 flex-1">${JSON.stringify(l.payload)}</span>
    </div>
  `).join('');
}

window.setMarketplaceMode = setMarketplaceMode;
window.setQuizBodyType = setQuizBodyType;
window.setQuizUsage = setQuizUsage;
window.renderDiscoveryWorkspace = renderDiscoveryWorkspace;
window.bookCarInquiry = bookCarInquiry;
