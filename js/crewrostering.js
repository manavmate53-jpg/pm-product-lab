// Product 6: Field Crew Rostering & On-Ground SLA Escalation Dashboard
// Grounded directly in NeoManpower operations: managing up to 133 field personnel across 200+ Mumbai events with zero SLA breaches

let rosteringData = { venues: [], scenarios: [] };
let selectedRosterScenario = null;
let rosterZones = [];
let standbyAvailable = 18;
let slaTimerSeconds = 900; // 15 mins
let slaTimerInterval = null;
let currentRosterStatus = 'STABLE';

document.addEventListener('DOMContentLoaded', () => {
  loadRosteringData();
});

async function loadRosteringData() {
  try {
    const res = await fetch('data/rostering-scenarios.json');
    rosteringData = await res.json();
    if (rosteringData.scenarios && rosteringData.scenarios.length > 0) {
      selectRosterScenario(rosteringData.scenarios[0].id);
    }
  } catch (err) {
    console.error('Failed to load rostering data:', err);
  }
}

function selectRosterScenario(scenarioId) {
  const scenario = rosteringData.scenarios.find(s => s.id === scenarioId);
  if (!scenario) return;
  selectedRosterScenario = scenario;

  // Highlight button
  rosteringData.scenarios.forEach(s => {
    const btn = document.getElementById(`roster-preset-btn-${s.id}`);
    if (btn) {
      if (s.id === scenarioId) {
        btn.classList.add('border-cyan-500', 'bg-cyan-950/40', 'text-cyan-300');
        btn.classList.remove('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      } else {
        btn.classList.remove('border-cyan-500', 'bg-cyan-950/40', 'text-cyan-300');
        btn.classList.add('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      }
    }
  });

  // Deep copy zones for mutation
  rosterZones = JSON.parse(JSON.stringify(scenario.zones));
  standbyAvailable = scenario.standbyBufferAvailable;
  currentRosterStatus = scenario.slaBreachRisk === 'High' ? 'CRITICAL' : 'OPTIMAL';

  // Set inputs
  const venueSelect = document.getElementById('roster-input-venue');
  const bufferInput = document.getElementById('roster-input-buffer');
  const bufferVal = document.getElementById('roster-val-buffer');

  if (venueSelect) venueSelect.value = scenario.venueId;
  if (bufferInput) bufferInput.value = Math.round((standbyAvailable / scenario.totalScheduled) * 100);
  if (bufferVal) bufferVal.textContent = `${standbyAvailable} Standby Crew`;

  // Reset SLA timer
  startSlaTimer(scenario.id === 'jio_world_morning_rush' ? 660 : 900); // 11 mins left or 15 mins

  renderRosterHeatmap();
  renderRosterSummary();
  renderRosterDispatchLogs(scenario.recommendedAction);
}

function startSlaTimer(seconds) {
  if (slaTimerInterval) clearInterval(slaTimerInterval);
  slaTimerSeconds = seconds;
  updateTimerDisplay();

  slaTimerInterval = setInterval(() => {
    if (slaTimerSeconds > 0) {
      slaTimerSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(slaTimerInterval);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('roster-timer-display');
  const statusEl = document.getElementById('roster-timer-status');
  if (!timerEl) return;

  const mins = Math.floor(slaTimerSeconds / 60);
  const secs = slaTimerSeconds % 60;
  timerEl.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  if (statusEl) {
    if (currentRosterStatus === 'RESOLVED' || currentRosterStatus === 'OPTIMAL') {
      statusEl.textContent = 'SLA Maintained: 0 Breaches';
      statusEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800';
    } else {
      statusEl.textContent = 'Urgent: Standby Dispatch Window Active';
      statusEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 animate-pulse';
    }
  }
}

function renderRosterHeatmap() {
  const container = document.getElementById('roster-zones-grid');
  if (!container) return;

  container.innerHTML = rosterZones.map((z, idx) => {
    const isCritical = z.status === 'critical';
    const isWarning = z.status === 'warning';
    const fillPct = Math.round((z.checkedIn / z.required) * 100);
    const badgeColor = isCritical ? 'text-rose-400 bg-rose-950/80 border-rose-800' :
                       isWarning ? 'text-amber-400 bg-amber-950/80 border-amber-800' :
                       'text-emerald-400 bg-emerald-950/80 border-emerald-800';

    return `
      <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-bold text-white">${z.name}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}">${z.status.toUpperCase()}</span>
          </div>
          <div class="flex items-baseline justify-between text-xs text-slate-300 font-mono mt-3">
            <span>Staff On-Ground:</span>
            <span class="text-sm font-bold text-white">${z.checkedIn} / ${z.required}</span>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div class="h-full ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'} transition-all" style="width: ${Math.min(100, fillPct)}%"></div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Deficit: <strong class="${z.required - z.checkedIn > 0 ? 'text-rose-400' : 'text-slate-400'}">${Math.max(0, z.required - z.checkedIn)}</strong></span>
          <button onclick="quickDispatchToZone(${idx})" class="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition-colors border border-slate-700">
            Dispatch +2
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderRosterSummary() {
  const totalReq = rosterZones.reduce((sum, z) => sum + z.required, 0);
  const totalChecked = rosterZones.reduce((sum, z) => sum + z.checkedIn, 0);
  const deficit = Math.max(0, totalReq - totalChecked);

  const reqEl = document.getElementById('roster-metric-required');
  const checkedEl = document.getElementById('roster-metric-checked');
  const standbyEl = document.getElementById('roster-metric-standby');
  const accuracyEl = document.getElementById('roster-metric-accuracy');

  if (reqEl) reqEl.textContent = totalReq;
  if (checkedEl) checkedEl.textContent = totalChecked;
  if (standbyEl) standbyEl.textContent = standbyAvailable;
  if (accuracyEl) accuracyEl.textContent = '100.0%';
}

function simulateNoShowsTrigger() {
  if (rosterZones.length > 0) {
    rosterZones[0].checkedIn = Math.max(16, rosterZones[0].checkedIn - 8);
    rosterZones[0].status = 'critical';
  }
  if (rosterZones.length > 1) {
    rosterZones[1].checkedIn = Math.max(28, rosterZones[1].checkedIn - 4);
    rosterZones[1].status = 'warning';
  }
  if (rosterZones.length > 3) {
    rosterZones[3].checkedIn = Math.max(20, rosterZones[3].checkedIn - 2);
    rosterZones[3].status = 'warning';
  }

  currentRosterStatus = 'CRITICAL';
  startSlaTimer(900); // 15 mins SLA countdown

  renderRosterHeatmap();
  renderRosterSummary();
  renderRosterDispatchLogs('INCIDENT TRIGGERED: 14 morning no-shows flagged at check-in turnstiles. SLA clock started.');

  if (window.showToast) {
    window.showToast('14 unconfirmed slots detected at venue gate. 15-minute SLA timer active.', 'error');
  }
}

function deployStandbyReserveCrew() {
  let neededTotal = 0;
  rosterZones.forEach(z => {
    const diff = z.required - z.checkedIn;
    if (diff > 0) neededTotal += diff;
  });

  if (neededTotal === 0) {
    if (window.showToast) window.showToast('All zones are currently at 100% required staffing', 'info');
    return;
  }

  const deployCount = Math.min(standbyAvailable, neededTotal);
  let deployedSoFar = 0;

  rosterZones.forEach(z => {
    const diff = z.required - z.checkedIn;
    if (diff > 0 && deployedSoFar < deployCount) {
      const take = Math.min(diff, deployCount - deployedSoFar);
      z.checkedIn += take;
      deployedSoFar += take;
      if (z.checkedIn >= z.required) z.status = 'optimal';
    }
  });

  standbyAvailable = Math.max(0, standbyAvailable - deployedSoFar);
  currentRosterStatus = 'RESOLVED';
  startSlaTimer(0);

  renderRosterHeatmap();
  renderRosterSummary();
  renderRosterDispatchLogs(`DISPATCH COMPLETED: Redeployed ${deployedSoFar} reserve personnel to venue posts in 11 minutes. Zero SLA breaches recorded.`);

  if (window.showToast) {
    window.showToast(`Deployed ${deployedSoFar} standby personnel. Venue postings at 100% capacity.`, 'success');
  }
}

function quickDispatchToZone(zoneIndex) {
  if (standbyAvailable < 2) {
    if (window.showToast) window.showToast('Standby reserve pool depleted', 'error');
    return;
  }
  const zone = rosterZones[zoneIndex];
  if (!zone) return;

  zone.checkedIn = Math.min(zone.required, zone.checkedIn + 2);
  standbyAvailable -= 2;
  if (zone.checkedIn >= zone.required) zone.status = 'optimal';

  renderRosterHeatmap();
  renderRosterSummary();
  renderRosterDispatchLogs(`Quick dispatch: Assigned +2 standby personnel to ${zone.name}.`);

  if (window.showToast) {
    window.showToast(`+2 crew dispatched to ${zone.name}`, 'info');
  }
}

function runQrPayoutReconciliation() {
  const totalChecked = rosterZones.reduce((sum, z) => sum + z.checkedIn, 0);
  const baseRateInr = 1200; // Daily shift rate
  const totalBasePayout = (totalChecked * baseRateInr).toLocaleString('en-IN');

  const reconciliationModal = document.getElementById('roster-reconciliation-log');
  if (reconciliationModal) {
    const payload = {
      audit_event: "shift.payout_reconciled",
      timestamp: new Date().toISOString(),
      venue: selectedRosterScenario ? selectedRosterScenario.venueId : "jio_world",
      verified_checkins: totalChecked,
      scheduled_personnel: selectedRosterScenario ? selectedRosterScenario.totalScheduled : 120,
      shift_hours: 9.0,
      overtime_exceptions_cleared: 3,
      sla_breaches: 0,
      sla_penalty_inr: 0,
      total_disbursement_inr: `₹${totalBasePayout}`,
      reconciliation_status: "100%_AUDITED_ZERO_VARIANCE",
      signoff_by: "Manav Mate (Founder & Operations Lead)"
    };
    reconciliationModal.textContent = JSON.stringify(payload, null, 2);
  }

  if (window.showToast) {
    window.showToast('100% QR hours reconciled. Zero payout variance across all personnel.', 'success');
  }
}

function renderRosterDispatchLogs(customMsg = '') {
  const container = document.getElementById('roster-dispatch-log');
  if (!container) return;

  const now = new Date().toLocaleTimeString();
  const logs = [
    { time: now, level: 'DISPATCH', msg: customMsg || 'Roster status verified.' },
    { time: now, level: 'AUDIT', msg: `Attendance geo-fence verified: QR check-in scanned at gate turnstiles.` },
    { time: now, level: 'SLA', msg: `Client contractual terms: 15-minute emergency fill threshold active. Current status: ZERO BREACHES.` }
  ];

  container.innerHTML = logs.map(l => `
    <div class="flex items-start gap-2.5 py-1.5 border-b border-slate-800/60 font-mono text-xs">
      <span class="text-slate-500 w-16">${l.time}</span>
      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${l.level === 'DISPATCH' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}">${l.level}</span>
      <span class="text-slate-300 flex-1">${l.msg}</span>
    </div>
  `).join('');
}

// Window exports
window.selectRosterScenario = selectRosterScenario;
window.simulateNoShowsTrigger = simulateNoShowsTrigger;
window.deployStandbyReserveCrew = deployStandbyReserveCrew;
window.quickDispatchToZone = quickDispatchToZone;
window.runQrPayoutReconciliation = runQrPayoutReconciliation;
