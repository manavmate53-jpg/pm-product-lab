// AutoMatch IQ: High-Intent Marketplace Discovery & Funnel Telemetry Engine
// Client-side dataset filtering, 3-step progressive matcher, TCO trade-off matrix, live event stream, and SQL runner

let vehiclesData = [];
let selectedVehicles = [];
let currentMode = 'quiz'; // 'quiz' (Variant B) or 'legacy' (Control)
let quizAnswers = {
  usage: 'City Traffic & Tight Parking',
  budget: 'mid', // 'low' (<10L), 'mid' (10-18L), 'high' (>18L)
  priority: 'safety' // 'safety', 'fuel', 'tech'
};
let legacyFilters = {
  fuel: 'all',
  transmission: 'all',
  budgetMax: 25,
  make: 'all'
};

let eventLogs = [];
let funnelChart = null;

// Preset SQL queries and results
const sqlPresets = {
  funnel: {
    title: "A/B Funnel Drop-off Comparison (PostgreSQL)",
    sql: `-- Query: Search-to-Lead Funnel Drop-off by Experiment Cohort
SELECT 
    cohort,
    COUNT(DISTINCT session_id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN event = 'filter_engaged' OR event = 'quiz_started' THEN session_id END) AS engaged_sessions,
    COUNT(DISTINCT CASE WHEN event = 'vehicle_detail_viewed' OR event = 'compare_opened' THEN session_id END) AS spec_evaluated,
    COUNT(DISTINCT CASE WHEN event = 'high_intent_lead_submitted' THEN session_id END) AS leads_submitted,
    ROUND(COUNT(DISTINCT CASE WHEN event = 'high_intent_lead_submitted' THEN session_id END) * 100.0 / COUNT(DISTINCT session_id), 2) AS conversion_rate_pct
FROM marketplace_events_stream
WHERE date_trunc('day', timestamp) >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY cohort;`,
    headers: ["Cohort", "Total Sessions", "Engaged", "Spec Evaluated", "Leads", "Conversion Rate"],
    rows: [
      ["Control (Legacy Filters)", "14,250", "6,840 (48.0%)", "3,135 (22.0%)", "1,596", "11.20%"],
      ["Variant B (Smart Quiz)", "14,180", "11,627 (82.0%)", "7,657 (54.0%)", "3,516", "24.80% (+121%)"]
    ]
  },
  cohort: {
    title: "Lead Distribution by Mumbai Locality (PostgreSQL)",
    sql: `-- Query: High-Intent Lead Quality and Average TCO by Mumbai Locality
SELECT 
    location,
    COUNT(*) AS total_inventory,
    ROUND(AVG(price_lakh), 2) AS avg_price_lakh,
    ROUND(AVG(estimated_3yr_tco), 2) AS avg_3yr_tco_lakh,
    SUM(CASE WHEN inspection_score >= 9.0 THEN 1 ELSE 0 END) AS high_grade_units,
    ROUND(SUM(lead_count) * 100.0 / NULLIF(SUM(view_count), 0), 2) AS locality_lead_ctr
FROM used_vehicle_mumbai_mview
GROUP BY location
ORDER BY locality_lead_ctr DESC;`,
    headers: ["Locality", "Inventory", "Avg Price", "Avg 3-Yr TCO", "Grade >=9.0", "Lead CTR"],
    rows: [
      ["Powai, Mumbai", "3", "₹15.10 L", "₹0.95 L", "3 units", "28.4%"],
      ["Bandra West / BKC", "3", "₹13.43 L", "₹1.67 L", "3 units", "26.1%"],
      ["Andheri (West & East)", "3", "₹10.85 L", "₹1.22 L", "2 units", "24.2%"],
      ["Thane & Mulund", "3", "₹12.63 L", "₹1.07 L", "3 units", "21.9%"],
      ["Worli & Dadar", "2", "₹17.45 L", "₹2.00 L", "2 units", "19.5%"]
    ]
  },
  price: {
    title: "Conversion Elasticity Across Price Brackets (PostgreSQL)",
    sql: `-- Query: Conversion Elasticity and TCO Sensitivity by Price Bracket
SELECT 
    CASE 
        WHEN price_lakh < 8.0 THEN 'Budget (< ₹8L)'
        WHEN price_lakh BETWEEN 8.0 AND 14.0 THEN 'Mid-Market (₹8L to ₹14L)'
        ELSE 'Premium (> ₹14L)'
    END AS price_tier,
    COUNT(*) AS vehicle_count,
    ROUND(AVG(resale_score), 1) AS avg_resale_index,
    ROUND(AVG(estimated_3yr_tco * 100.0 / price_lakh), 1) AS tco_to_price_ratio_pct,
    '24.8% vs 11.2%' AS a_b_uplift
FROM used_vehicle_inventory
GROUP BY 1
ORDER BY MIN(price_lakh);`,
    headers: ["Price Tier", "Vehicles", "Resale Index", "TCO/Price %", "A/B Uplift"],
    rows: [
      ["Budget (< ₹8L)", "4 cars", "90.5 / 100", "11.8%", "+94% uplift"],
      ["Mid-Market (₹8L to ₹14L)", "8 cars", "88.4 / 100", "11.2%", "+142% uplift"],
      ["Premium (> ₹14L)", "6 cars", "87.0 / 100", "11.5%", "+116% uplift"]
    ]
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadVehiclesData();
  setupFilterListeners();
  initSqlPreset('funnel');
});

// Load Vehicles
async function loadVehiclesData() {
  try {
    const res = await fetch('data/vehicles.json');
    const data = await res.json();
    vehiclesData = data.vehicles;
  } catch (err) {
    // Fallback if fetch is delayed
    vehiclesData = [];
  }

  // Render initial view
  renderDiscoveryWorkspace();
  initFunnelChart();

  // Log initial session event
  logTelemetryEvent("marketplace_session_started", {
    referrer: "portfolio_hub",
    city: "Mumbai",
    inventory_count: vehiclesData.length,
    active_cohort: "Variant_B_Smart_Quiz"
  });
}

// Toggle between Legacy Filter View and Smart Quiz View
function setMarketplaceMode(mode) {
  currentMode = mode;
  
  const btnQuiz = document.getElementById('btn-mode-quiz');
  const btnLegacy = document.getElementById('btn-mode-legacy');

  if (mode === 'quiz') {
    btnQuiz?.classList.add('active');
    btnLegacy?.classList.remove('active');
    logTelemetryEvent("experiment_mode_switched", {
      cohort: "Variant_B_Smart_Quiz",
      reason: "user_toggle"
    });
    showToast("Switched to Variant B: Smart 3-Step Matcher", "info");
  } else {
    btnLegacy?.classList.add('active');
    btnQuiz?.classList.remove('active');
    logTelemetryEvent("experiment_mode_switched", {
      cohort: "Control_Legacy_Filters",
      reason: "user_toggle"
    });
    showToast("Switched to Control: Legacy Filters (High Cognitive Load)", "warning");
  }

  renderDiscoveryWorkspace();
}

// Render Discovery Left Column
function renderDiscoveryWorkspace() {
  const container = document.getElementById('automatch-discovery-container');
  if (!container) return;

  if (currentMode === 'quiz') {
    renderQuizView(container);
  } else {
    renderLegacyView(container);
  }

  if (window.lucide) window.lucide.createIcons();
}

// 1. Render Smart Progressive Quiz View (Variant B)
function renderQuizView(container) {
  // Rank top 3 matches based on quiz answers
  const rankedMatches = calculateRankedMatches();

  container.innerHTML = `
    <!-- 3-Step Guided Quiz Questions -->
    <div class="rounded-xl border border-amber-900/40 bg-slate-900/70 p-4 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="text-xs font-bold text-white uppercase tracking-wider">Smart Progressive Matcher (3 Steps)</span>
        </div>
        <span class="text-[11px] font-mono text-amber-400 font-semibold">Variant B &middot; Top 3 Output</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Step 1: Usage -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-slate-300 uppercase block">1. Commute Pattern</label>
          <select id="quiz-usage" onchange="updateQuizStep('usage', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500">
            <option value="City Traffic & Tight Parking" ${quizAnswers.usage === 'City Traffic & Tight Parking' ? 'selected' : ''}>City Traffic (Andheri / BKC)</option>
            <option value="Family Long Drives & Highways" ${quizAnswers.usage === 'Family Long Drives & Highways' ? 'selected' : ''}>Highway / Long Drives</option>
            <option value="Low Maintenance Daily Driver" ${quizAnswers.usage === 'Low Maintenance Daily Driver' ? 'selected' : ''}>Low TCO Daily Driver</option>
          </select>
        </div>

        <!-- Step 2: Budget -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-slate-300 uppercase block">2. Budget / Monthly TCO</label>
          <select id="quiz-budget" onchange="updateQuizStep('budget', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500">
            <option value="low" ${quizAnswers.budget === 'low' ? 'selected' : ''}>Under ₹10 Lakhs (Budget)</option>
            <option value="mid" ${quizAnswers.budget === 'mid' ? 'selected' : ''}>₹10 to ₹18 Lakhs (Sweet Spot)</option>
            <option value="high" ${quizAnswers.budget === 'high' ? 'selected' : ''}>₹18+ Lakhs (Premium)</option>
          </select>
        </div>

        <!-- Step 3: Priority -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-slate-300 uppercase block">3. Must-Have Priority</label>
          <select id="quiz-priority" onchange="updateQuizStep('priority', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500">
            <option value="safety" ${quizAnswers.priority === 'safety' ? 'selected' : ''}>5-Star Safety Rating</option>
            <option value="fuel" ${quizAnswers.priority === 'fuel' ? 'selected' : ''}>Lowest Fuel Cost (EV/Hybrid/CNG)</option>
            <option value="tech" ${quizAnswers.priority === 'tech' ? 'selected' : ''}>Automatic Transmission & Tech</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Ranked Top Matches Header -->
    <div class="flex items-center justify-between pt-2">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold text-white">Top 3 Recommended Matches</h3>
        <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">Filtered from 18 Mumbai listings</span>
      </div>
      <div id="compare-trigger-badge" class="${selectedVehicles.length > 0 ? '' : 'hidden'}">
        <button onclick="openCompareModal()" class="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition-colors">
          <i data-lucide="columns" class="w-3.5 h-3.5"></i>
          <span>Compare Selected (${selectedVehicles.length}/2)</span>
        </button>
      </div>
    </div>

    <!-- Top 3 Vehicle Cards -->
    <div class="space-y-3.5">
      ${rankedMatches.map((car, index) => renderVehicleCard(car, index + 1, true)).join('')}
    </div>
  `;
}

// 2. Render Legacy Filter View (Control)
function renderLegacyView(container) {
  // Filter vehicles according to legacy criteria
  const filtered = vehiclesData.filter(car => {
    if (legacyFilters.fuel !== 'all' && car.fuel.toLowerCase() !== legacyFilters.fuel.toLowerCase()) return false;
    if (legacyFilters.transmission !== 'all' && !car.transmission.toLowerCase().includes(legacyFilters.transmission.toLowerCase())) return false;
    if (car.priceLakh > legacyFilters.budgetMax) return false;
    if (legacyFilters.make !== 'all' && car.make.toLowerCase() !== legacyFilters.make.toLowerCase()) return false;
    return true;
  });

  container.innerHTML = `
    <!-- Legacy Cluttered Filter Sidebar & Header -->
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <i data-lucide="filter" class="w-4 h-4 text-slate-400"></i>
          <span class="text-xs font-bold text-white uppercase tracking-wider">Legacy Filter Bar (Control Group)</span>
        </div>
        <span class="text-[11px] font-mono text-slate-400">11.2% Lead Conversion Rate</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Make</label>
          <select onchange="updateLegacyFilter('make', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white">
            <option value="all">All Makes (18)</option>
            <option value="Tata">Tata</option>
            <option value="Maruti Suzuki">Maruti Suzuki</option>
            <option value="Hyundai">Hyundai</option>
            <option value="Mahindra">Mahindra</option>
            <option value="Kia">Kia</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fuel Type</label>
          <select onchange="updateLegacyFilter('fuel', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white">
            <option value="all">All Fuels</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="EV">EV</option>
            <option value="CNG">CNG</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transmission</label>
          <select onchange="updateLegacyFilter('transmission', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white">
            <option value="all">All Gearboxes</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Price: ₹${legacyFilters.budgetMax}L</label>
          <input type="range" min="6" max="25" step="1" value="${legacyFilters.budgetMax}" onchange="updateLegacyFilter('budgetMax', parseFloat(this.value))" class="w-full">
        </div>
      </div>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between pt-1">
      <span class="text-xs text-slate-400">Displaying <strong class="text-white">${filtered.length}</strong> of 18 inventory units</span>
      <div id="compare-trigger-badge" class="${selectedVehicles.length > 0 ? '' : 'hidden'}">
        <button onclick="openCompareModal()" class="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition-colors">
          <i data-lucide="columns" class="w-3.5 h-3.5"></i>
          <span>Compare Selected (${selectedVehicles.length}/2)</span>
        </button>
      </div>
    </div>

    <!-- Long List of 18 Cards (Choice Overload) -->
    <div class="space-y-3">
      ${filtered.length > 0 
        ? filtered.map(car => renderVehicleCard(car, null, false)).join('')
        : `<div class="p-8 text-center text-slate-400 rounded-xl border border-slate-800 bg-slate-900/30">
            <p class="text-xs">Zero listings match your filter combo. (Demonstrates zero-result drop-off)</p>
           </div>`
      }
    </div>
  `;
}

// Render individual vehicle card
function renderVehicleCard(car, rankIndex, isQuiz) {
  const isSelected = selectedVehicles.some(v => v.id === car.id);

  let rankBadge = '';
  if (rankIndex) {
    let rankColor = "bg-blue-600 text-white";
    if (rankIndex === 1) rankColor = "bg-amber-500 text-slate-950 font-bold";
    rankBadge = `
      <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${rankColor}">
        #${rankIndex} Ranked Match
      </span>
    `;
  }

  return `
    <div class="rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 bg-slate-900/40'} hover:border-slate-700 p-4 transition-all">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-2.5">
        <div class="flex items-center gap-2">
          ${rankBadge}
          <h4 class="text-sm font-bold text-white">${car.year} ${car.make} ${car.model}</h4>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-sm font-mono font-bold text-emerald-400">${car.priceFormatted}</div>
          <span class="text-[10px] text-slate-500">(${car.mileageKm.toLocaleString()} km)</span>
        </div>
      </div>

      <!-- Why Match Callout Pill -->
      ${isQuiz ? `
        <div class="flex items-start gap-2 bg-amber-950/40 border border-amber-900/50 rounded-lg p-2 text-xs text-amber-200 mb-3">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"></i>
          <span><strong>Why this matches:</strong> ${car.whyMatch}</span>
        </div>
      ` : ''}

      <!-- Spec Badges Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300 mb-3">
        <div class="p-1.5 rounded bg-slate-950 border border-slate-800">
          <span class="text-slate-500 block text-[9px]">Location</span>
          <span class="truncate block">${car.location}</span>
        </div>
        <div class="p-1.5 rounded bg-slate-950 border border-slate-800">
          <span class="text-slate-500 block text-[9px]">Fuel / Gearbox</span>
          <span class="truncate block">${car.fuel} &middot; ${car.transmission}</span>
        </div>
        <div class="p-1.5 rounded bg-slate-950 border border-slate-800">
          <span class="text-slate-500 block text-[9px]">3-Yr Est TCO</span>
          <span class="text-amber-400 block font-bold">₹${car.estimated3YrTCO} Lakhs</span>
        </div>
        <div class="p-1.5 rounded bg-slate-950 border border-slate-800">
          <span class="text-slate-500 block text-[9px]">Inspection Grade</span>
          <span class="text-emerald-400 block font-bold">${car.inspectionScore} / 10 &middot; ${car.owner}</span>
        </div>
      </div>

      <!-- Actions Row -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <label class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer select-none">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleVehicleSelection('${car.id}')" class="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0">
          <span>Compare in TCO Matrix</span>
        </label>

        <div class="flex items-center gap-2">
          <button onclick="viewVehicleDetails('${car.id}')" class="text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors">
            Inspect Specs
          </button>
          <button onclick="submitHighIntentLead('${car.id}')" class="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition-colors shadow-sm">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
            <span>Book Home Inspection</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Calculate Top 3 Matches for Quiz
function calculateRankedMatches() {
  if (!vehiclesData.length) return [];

  return [...vehiclesData]
    .map(car => {
      let score = 0;

      // Usage match
      if (car.bestFor.toLowerCase() === quizAnswers.usage.toLowerCase()) score += 40;

      // Budget fit
      if (quizAnswers.budget === 'low' && car.priceLakh <= 10) score += 30;
      else if (quizAnswers.budget === 'mid' && car.priceLakh > 10 && car.priceLakh <= 18) score += 30;
      else if (quizAnswers.budget === 'high' && car.priceLakh > 18) score += 30;

      // Priority fit
      if (quizAnswers.priority === 'safety' && car.safetyRating === 5) score += 30;
      else if (quizAnswers.priority === 'fuel' && ['ev', 'hybrid', 'cng'].includes(car.fuel.toLowerCase())) score += 30;
      else if (quizAnswers.priority === 'tech' && car.transmission.toLowerCase().includes('auto')) score += 30;

      // TCO penalty/bonus
      if (car.estimated3YrTCO <= 1.0) score += 10;

      return { ...car, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

// Update Quiz Answers
function updateQuizStep(stepKey, value) {
  quizAnswers[stepKey] = value;

  logTelemetryEvent("quiz_step_completed", {
    step_key: stepKey,
    selected_value: value,
    session_cohort: "Variant_B"
  });

  renderDiscoveryWorkspace();
}

// Update Legacy Filter
function updateLegacyFilter(filterKey, value) {
  legacyFilters[filterKey] = value;

  logTelemetryEvent("legacy_filter_applied", {
    filter_key: filterKey,
    selected_value: value,
    session_cohort: "Control_Legacy"
  });

  renderDiscoveryWorkspace();
}

// Toggle vehicle selection for compare
function toggleVehicleSelection(carId) {
  const index = selectedVehicles.findIndex(v => v.id === carId);
  const car = vehiclesData.find(v => v.id === carId);

  if (index >= 0) {
    selectedVehicles.splice(index, 1);
  } else {
    if (selectedVehicles.length >= 2) {
      showToast("Comparison limited to 2 vehicles at once", "warning");
      return;
    }
    if (car) selectedVehicles.push(car);
  }

  logTelemetryEvent("compare_selection_toggled", {
    listing_id: carId,
    car_name: car ? `${car.make} ${car.model}` : "unknown",
    total_selected: selectedVehicles.length
  });

  renderDiscoveryWorkspace();

  if (selectedVehicles.length === 2) {
    openCompareModal();
  }
}

// Open Compare Modal / Drawer
function openCompareModal() {
  if (selectedVehicles.length === 0) {
    showToast("Select at least 1 vehicle to inspect trade-offs", "warning");
    return;
  }

  const modal = document.getElementById('automatch-compare-modal');
  const content = document.getElementById('automatch-compare-content');
  if (!modal || !content) return;

  const carA = selectedVehicles[0];
  const carB = selectedVehicles[1] || selectedVehicles[0];

  content.innerHTML = `
    <div class="grid grid-cols-2 gap-4 text-xs font-mono">
      <!-- Col 1: Vehicle A -->
      <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div class="border-b border-slate-800 pb-2">
          <span class="text-[10px] text-blue-400 font-bold uppercase">Vehicle A</span>
          <h4 class="text-sm font-bold text-white font-sans">${carA.year} ${carA.make} ${carA.model}</h4>
          <div class="text-emerald-400 font-bold text-sm mt-0.5">${carA.priceFormatted}</div>
        </div>
        <div class="space-y-1.5 text-slate-300">
          <div>&bull; <strong>Fuel &amp; Gearbox:</strong> ${carA.fuel} &middot; ${carA.transmission}</div>
          <div>&bull; <strong>3-Yr Fuel &amp; Service:</strong> <span class="text-amber-400">₹${carA.estimated3YrTCO} Lakhs</span></div>
          <div>&bull; <strong>Resale Score:</strong> ${carA.resaleScore} / 100</div>
          <div>&bull; <strong>Safety Rating:</strong> ${'★'.repeat(carA.safetyRating)} (${carA.safetyRating}-Star NCAP)</div>
          <div>&bull; <strong>Location:</strong> ${carA.location}</div>
        </div>
        <button onclick="submitHighIntentLead('${carA.id}')" class="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs mt-3">
          Book Doorstep Inspection (Vehicle A)
        </button>
      </div>

      <!-- Col 2: Vehicle B -->
      <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div class="border-b border-slate-800 pb-2">
          <span class="text-[10px] text-amber-400 font-bold uppercase">Vehicle B</span>
          <h4 class="text-sm font-bold text-white font-sans">${carB.year} ${carB.make} ${carB.model}</h4>
          <div class="text-emerald-400 font-bold text-sm mt-0.5">${carB.priceFormatted}</div>
        </div>
        <div class="space-y-1.5 text-slate-300">
          <div>&bull; <strong>Fuel &amp; Gearbox:</strong> ${carB.fuel} &middot; ${carB.transmission}</div>
          <div>&bull; <strong>3-Yr Fuel &amp; Service:</strong> <span class="text-amber-400">₹${carB.estimated3YrTCO} Lakhs</span></div>
          <div>&bull; <strong>Resale Score:</strong> ${carB.resaleScore} / 100</div>
          <div>&bull; <strong>Safety Rating:</strong> ${'★'.repeat(carB.safetyRating)} (${carB.safetyRating}-Star NCAP)</div>
          <div>&bull; <strong>Location:</strong> ${carB.location}</div>
        </div>
        <button onclick="submitHighIntentLead('${carB.id}')" class="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs mt-3">
          Book Doorstep Inspection (Vehicle B)
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  logTelemetryEvent("tco_compare_drawer_opened", {
    vehicle_a_id: carA.id,
    vehicle_b_id: carB.id,
    tco_diff_lakh: Math.abs(carA.estimated3YrTCO - carB.estimated3YrTCO).toFixed(2)
  });
}

function closeCompareModal() {
  const modal = document.getElementById('automatch-compare-modal');
  if (modal) modal.classList.add('hidden');
}

// Inspect vehicle details modal or telemetry
function viewVehicleDetails(carId) {
  const car = vehiclesData.find(v => v.id === carId);
  if (!car) return;

  logTelemetryEvent("vehicle_spec_evaluated", {
    listing_id: car.id,
    price_lakh: car.priceLakh,
    location: car.location,
    safety_rating: car.safetyRating
  });

  showToast(`Inspecting ${car.make} ${car.model} specifications`, "info");
}

// High intent lead conversion action
function submitHighIntentLead(carId) {
  const car = vehiclesData.find(v => v.id === carId);
  const carName = car ? `${car.make} ${car.model}` : "Vehicle";

  logTelemetryEvent("high_intent_lead_submitted", {
    listing_id: carId,
    car_name: carName,
    location: car?.location || "Mumbai",
    cohort: currentMode === 'quiz' ? "Variant_B" : "Control",
    buyer_intent: "scheduled_home_inspection",
    timestamp_utc: new Date().toISOString()
  });

  showToast(`Lead Confirmed: Free home inspection booked for ${carName}!`, "success");
  closeCompareModal();
}

// Telemetry Event Stream Logger
function logTelemetryEvent(eventName, properties = {}) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + "." + Math.floor(now.getMilliseconds() / 100);
  const sessionId = "sess_mum_" + Math.random().toString(36).substring(2, 7);

  const eventPayload = {
    timestamp: timeStr,
    event: eventName,
    session_id: sessionId,
    experiment_cohort: currentMode === 'quiz' ? "Variant_B_Smart_Quiz" : "Control_Legacy",
    properties: properties
  };

  eventLogs.unshift(eventPayload);
  renderEventStream();
}

// Render Event Stream in Right Column
function renderEventStream() {
  const streamEl = document.getElementById('automatch-event-stream');
  if (!streamEl) return;

  streamEl.innerHTML = eventLogs.slice(0, 12).map(ev => {
    let tagColor = "text-blue-400 bg-blue-950/60 border-blue-800";
    if (ev.event.includes('lead')) tagColor = "text-emerald-400 bg-emerald-950/60 border-emerald-800";
    else if (ev.event.includes('quiz')) tagColor = "text-amber-400 bg-amber-950/60 border-amber-800";

    return `
      <div class="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono space-y-1">
        <div class="flex items-center justify-between">
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold border ${tagColor}">${ev.event}</span>
          <span class="text-slate-500 text-[10px]">${ev.timestamp}</span>
        </div>
        <div class="text-slate-300 text-[10px] truncate">
          ${JSON.stringify(ev.properties)}
        </div>
      </div>
    `;
  }).join('');
}

// Clear event logs
function clearTelemetryLogs() {
  eventLogs = [];
  renderEventStream();
  showToast("Telemetry console cleared", "info");
}

// Chart.js Funnel Comparison Initialization
function initFunnelChart() {
  const canvas = document.getElementById('automatch-funnel-chart');
  if (!canvas || !window.Chart) return;

  if (funnelChart) {
    funnelChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  funnelChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1. Landing Page', '2. Engagement', '3. Spec Evaluated', '4. Lead Submit'],
      datasets: [
        {
          label: 'Control (Legacy Filters)',
          data: [100, 48.0, 22.0, 11.2],
          backgroundColor: 'rgba(100, 116, 139, 0.7)',
          borderColor: 'rgba(100, 116, 139, 1)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Variant B (Smart Quiz)',
          data: [100, 82.0, 54.0, 24.8],
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { size: 10, family: 'Inter' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}% conversion`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#64748b',
            font: { size: 9 },
            callback: (val) => val + '%'
          },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        },
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
}

// SQL Query Runner Presets
function initSqlPreset(presetKey) {
  const preset = sqlPresets[presetKey];
  if (!preset) return;

  // Highlight tab
  ['funnel', 'cohort', 'price'].forEach(key => {
    const tab = document.getElementById(`sql-tab-${key}`);
    if (tab) {
      if (key === presetKey) {
        tab.className = "px-2.5 py-1 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800";
      } else {
        tab.className = "px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800";
      }
    }
  });

  // Display SQL code
  const codeEl = document.getElementById('sql-code-viewer');
  if (codeEl) codeEl.textContent = preset.sql;

  // Render Table
  const thead = document.getElementById('sql-table-head');
  const tbody = document.getElementById('sql-table-body');

  if (thead) {
    thead.innerHTML = `<tr>${preset.headers.map(h => `<th class="py-2 px-2.5">${h}</th>`).join('')}</tr>`;
  }

  if (tbody) {
    tbody.innerHTML = preset.rows.map(row => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 text-[11px] font-mono">
        ${row.map((cell, idx) => `
          <td class="py-2 px-2.5 ${idx === 0 ? 'text-white font-semibold' : (cell.includes('+') || cell.includes('24.8') ? 'text-emerald-400 font-bold' : 'text-slate-300')}">
            ${cell}
          </td>
        `).join('')}
      </tr>
    `).join('');
  }

  logTelemetryEvent("sql_query_executed", {
    preset_selected: presetKey,
    query_title: preset.title
  });
}

function setupFilterListeners() {
  // Any extra bindings
}

// Expose globally
window.setMarketplaceMode = setMarketplaceMode;
window.updateQuizStep = updateQuizStep;
window.updateLegacyFilter = updateLegacyFilter;
window.toggleVehicleSelection = toggleVehicleSelection;
window.openCompareModal = openCompareModal;
window.closeCompareModal = closeCompareModal;
window.viewVehicleDetails = viewVehicleDetails;
window.submitHighIntentLead = submitHighIntentLead;
window.clearTelemetryLogs = clearTelemetryLogs;
window.initSqlPreset = initSqlPreset;
window.initFunnelChart = initFunnelChart;
window.renderDiscoveryWorkspace = renderDiscoveryWorkspace;
