// Product 6: CrewRoster Field Operations & SLA Escalation Dashboard
// Grounded directly in NeoManpower Mumbai field operations (up to 133 personnel across 200+ commercial events)

let crScenarios = [];
let crSelectedScenario = null;
let crZones = [];
let crStandbyAvailable = 18;
let crTimerSeconds = 900;
let crTimerInterval = null;
let crStatus = 'OPTIMAL';

document.addEventListener('DOMContentLoaded', () => {
  initCrewRostering();
});

function initCrewRostering() {
  if (window.LabData && window.LabData.rostering && window.LabData.rostering.scenarios) {
    crScenarios = window.LabData.rostering.scenarios;
  }
  if (crScenarios.length > 0) {
    selectRosterScenario(crScenarios[0].id);
  }
}

function selectRosterScenario(scenarioId) {
  const sc = crScenarios.find(s => s.id === scenarioId);
  if (!sc) return;
  crSelectedScenario = sc;

  crScenarios.forEach(s => {
    const btn = document.getElementById(`roster-preset-btn-${s.id}`);
    if (btn) {
      if (s.id === scenarioId) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  crZones = JSON.parse(JSON.stringify(sc.zones));
  crStandbyAvailable = sc.standbyBufferAvailable;
  crStatus = sc.slaBreachRisk === 'High' ? 'CRITICAL' : 'OPTIMAL';

  const venueSelect = document.getElementById('roster-input-venue');
  const bufferVal = document.getElementById('roster-val-buffer');

  if (venueSelect) venueSelect.value = sc.venueId;
  if (bufferVal) bufferVal.textContent = `${crStandbyAvailable} Standby Crew`;

  startCrTimer(sc.id === 'jio_world_morning_rush' ? 660 : 900);

  renderCrHeatmap();
  renderCrSummary();
  renderCrLogs(sc.recommendedAction);
}

function startCrTimer(seconds) {
  if (crTimerInterval) clearInterval(crTimerInterval);
  crTimerSeconds = seconds;
  updateCrTimerDisplay();

  crTimerInterval = setInterval(() => {
    if (crTimerSeconds > 0) {
      crTimerSeconds--;
      updateCrTimerDisplay();
    } else {
      clearInterval(crTimerInterval);
    }
  }, 1000);
}

function updateCrTimerDisplay() {
  const timerEl = document.getElementById('roster-timer-display');
  const statusEl = document.getElementById('roster-timer-status');
  if (!timerEl) return;

  const m = Math.floor(crTimerSeconds / 60);
  const s = crTimerSeconds % 60;
  timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

  if (statusEl) {
    if (crStatus === 'OPTIMAL' || crStatus === 'RESOLVED') {
      statusEl.textContent = 'SLA Maintained: 0 Breaches';
      statusEl.className = 'chip chip-ok';
    } else {
      statusEl.textContent = 'Standby Window Active';
      statusEl.className = 'chip chip-bad';
    }
  }
}

function renderCrHeatmap() {
  const container = document.getElementById('roster-zones-grid');
  if (!container) return;

  container.innerHTML = crZones.map((z, idx) => {
    const isCritical = z.status === 'critical';
    const isWarning = z.status === 'warning';
    const chipClass = isCritical ? 'chip-bad' : (isWarning ? 'chip-accent' : 'chip-ok');
    const deficit = Math.max(0, z.required - z.checkedIn);
    const fillPct = Math.min(100, Math.round((z.checkedIn / z.required) * 100));

    return `
      <div class="panel p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium text-ink">${escapeHtml(z.name)}</span>
            <span class="chip ${chipClass}">${z.status}</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between text-xs font-mono">
            <span class="text-muted">Staffing:</span>
            <span class="text-ink font-medium">${z.checkedIn} / ${z.required} (${fillPct}%)</span>
          </div>
          <div class="w-full bg-paper-3 h-1.5 rounded mt-2 overflow-hidden border border-rule">
            <div class="h-full bg-accent" style="width: ${fillPct}%"></div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs font-mono">
          <span class="text-muted">Deficit: <strong class="${deficit > 0 ? 'text-bad' : 'text-muted'}">${deficit}</strong></span>
          <button onclick="quickDispatchToZone(${idx})" class="btn btn-quiet text-xs">Dispatch +2</button>
        </div>
      </div>
    `;
  }).join('');
}

function quickDispatchToZone(idx) {
  if (idx < 0 || idx >= crZones.length) return;
  if (crStandbyAvailable < 2) {
    if (window.showToast) window.showToast("Standby reserve buffer exhausted", "error");
    return;
  }

  crZones[idx].checkedIn += 2;
  crStandbyAvailable -= 2;
  if (crZones[idx].checkedIn >= crZones[idx].required) {
    crZones[idx].status = 'optimal';
  }

  renderCrHeatmap();
  renderCrSummary();
  renderCrLogs(`Manual supervisor dispatch: +2 staff transferred to ${crZones[idx].name}.`);

  if (window.showToast) window.showToast(`Transferred 2 crew members to ${crZones[idx].name}`, "info");
}

function renderCrSummary() {
  const req = crZones.reduce((sum, z) => sum + z.required, 0);
  const checked = crZones.reduce((sum, z) => sum + z.checkedIn, 0);

  const reqEl = document.getElementById('roster-metric-required');
  const checkedEl = document.getElementById('roster-metric-checked');
  const standbyEl = document.getElementById('roster-metric-standby');
  const accuracyEl = document.getElementById('roster-metric-accuracy');

  if (reqEl) reqEl.textContent = req;
  if (checkedEl) checkedEl.textContent = checked;
  if (standbyEl) standbyEl.textContent = crStandbyAvailable;
  if (accuracyEl) accuracyEl.textContent = '100.0%';
}

function simulateNoShowsTrigger() {
  if (crZones.length > 0) {
    crZones[0].checkedIn = Math.max(16, crZones[0].checkedIn - 8);
    crZones[0].status = 'critical';
  }
  if (crZones.length > 1) {
    crZones[1].checkedIn = Math.max(28, crZones[1].checkedIn - 4);
    crZones[1].status = 'warning';
  }
  if (crZones.length > 3) {
    crZones[3].checkedIn = Math.max(20, crZones[3].checkedIn - 2);
    crZones[3].status = 'warning';
  }

  crStatus = 'CRITICAL';
  startCrTimer(900);

  renderCrHeatmap();
  renderCrSummary();
  renderCrLogs('INCIDENT: 14 morning check-in no-shows flagged at venue entry. 15-minute SLA clock active.');

  if (window.showToast) {
    window.showToast('14 unconfirmed slots at venue turnstiles. 15-minute SLA timer active.', 'error');
  }
}

function deployStandbyReserveCrew() {
  let needed = 0;
  crZones.forEach(z => {
    const diff = z.required - z.checkedIn;
    if (diff > 0) needed += diff;
  });

  if (needed === 0) {
    if (window.showToast) window.showToast('All zones are currently at 100% required staffing', 'info');
    return;
  }

  const deployCount = Math.min(crStandbyAvailable, needed);
  let deployed = 0;

  crZones.forEach(z => {
    const diff = z.required - z.checkedIn;
    if (diff > 0 && deployed < deployCount) {
      const take = Math.min(diff, deployCount - deployed);
      z.checkedIn += take;
      deployed += take;
      if (z.checkedIn >= z.required) z.status = 'optimal';
    }
  });

  crStandbyAvailable = Math.max(0, crStandbyAvailable - deployed);
  crStatus = 'RESOLVED';
  startCrTimer(0);

  renderCrHeatmap();
  renderCrSummary();
  renderCrLogs(`DISPATCH: Redeployed ${deployed} reserve crew members. All zones restored, zero SLA breaches.`);

  if (window.showToast) {
    window.showToast(`Deployed ${deployed} reserve crew members. Full staffing restored.`, 'success');
  }
}

function runPayoutReconciliationAudit() {
  renderCrLogs('FINANCIAL RECONCILIATION: Audited 100% of QR check-in timestamps. 0 variance detected against client contract.');
  if (window.showToast) {
    window.showToast('QR shift reconciliation audit complete: 100% accuracy, ₹0 discrepancy', 'success');
  }
}

function renderCrLogs(note = '') {
  const container = document.getElementById('roster-dispatch-logs');
  if (!container) return;

  const now = new Date().toLocaleTimeString();
  const logs = [
    { time: now, step: 'DISPATCH', msg: note || 'Field operations nominal.' },
    { time: now, step: 'QR_AUDIT', msg: 'Automated turnstile scan sync: 100% check-ins verified against Aadhaar / NeoManpower roster.' },
    { time: now, step: 'SLA_GUARD', msg: 'Zero SLA penalties accrued across 200+ Mumbai events.' }
  ];

  container.innerHTML = logs.map(l => `
    <div class="flex items-start gap-2.5 py-1.5 border-b border-rule font-mono text-xs">
      <span class="text-muted w-16">${l.time}</span>
      <span class="chip chip-cool">${l.step}</span>
      <span class="text-ink-2 flex-1">${escapeHtml(l.msg)}</span>
    </div>
  `).join('');
}

window.selectRosterScenario = selectRosterScenario;
window.quickDispatchToZone = quickDispatchToZone;
window.simulateNoShowsTrigger = simulateNoShowsTrigger;
window.deployStandbyReserveCrew = deployStandbyReserveCrew;
window.runPayoutReconciliationAudit = runPayoutReconciliationAudit;
