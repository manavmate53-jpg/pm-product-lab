// Product 5: FlashQueue Virtual Waiting Room & Flash Queue Simulator
// Token bucket traffic shaping, bot heuristic quarantine, and origin capacity backpressure

let fqScenarios = [];
let fqSelectedScenario = null;
let fqState = {
  totalQueued: 50000,
  admittedPerSec: 500,
  originCapacityTps: 500,
  abandonmentRatePct: 4.6,
  originCpuPct: 68,
  userPosition: 1428,
  userWaitSecs: 134,
  botQuarantined: 4000
};

document.addEventListener('DOMContentLoaded', () => {
  initFlashQueue();
});

function initFlashQueue() {
  if (window.LabData && window.LabData.queue && window.LabData.queue.scenarios) {
    fqScenarios = window.LabData.queue.scenarios;
  }
  setupFqListeners();
  if (fqScenarios.length > 0) {
    selectQueueScenario(fqScenarios[0].id);
  }
}

function setupFqListeners() {
  const influxInput = document.getElementById('queue-input-influx');
  const tpsInput = document.getElementById('queue-input-tps');

  if (influxInput) {
    influxInput.addEventListener('input', updateQueueInputs);
  }
  if (tpsInput) {
    tpsInput.addEventListener('input', updateQueueInputs);
  }
}

function selectQueueScenario(scenarioId) {
  const sc = fqScenarios.find(s => s.id === scenarioId);
  if (!sc) return;
  fqSelectedScenario = sc;

  fqScenarios.forEach(s => {
    const btn = document.getElementById(`queue-preset-btn-${s.id}`);
    if (btn) {
      if (s.id === scenarioId) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  const influxInput = document.getElementById('queue-input-influx');
  const tpsInput = document.getElementById('queue-input-tps');
  const algoSelect = document.getElementById('queue-input-algo');
  const influxVal = document.getElementById('queue-val-influx');
  const tpsVal = document.getElementById('queue-val-tps');

  if (influxInput) influxInput.value = sc.influxUsers;
  if (tpsInput) tpsInput.value = sc.originTpsLimit;
  if (algoSelect) algoSelect.value = sc.queueAlgorithm;
  if (influxVal) influxVal.textContent = sc.influxUsers.toLocaleString('en-IN');
  if (tpsVal) tpsVal.textContent = `${sc.originTpsLimit} TPS`;

  fqState.totalQueued = sc.influxUsers;
  fqState.originCapacityTps = sc.originTpsLimit;
  fqState.admittedPerSec = sc.expectedTokensPerSec;
  fqState.abandonmentRatePct = sc.simulatedDropoffRate;
  fqState.originCpuPct = sc.originCpuLoadPct;
  fqState.userPosition = Math.floor(sc.influxUsers * 0.03) + 420;
  fqState.userWaitSecs = sc.averageWaitSeconds;
  fqState.botQuarantined = Math.floor(sc.influxUsers * (sc.botPercentage / 100));

  renderFqMetrics();
  renderFqUserCard();
  renderFqTelemetry(sc.statusMessage);
}

function updateQueueInputs() {
  const influx = parseInt(document.getElementById('queue-input-influx')?.value || '50000', 10);
  const tps = parseInt(document.getElementById('queue-input-tps')?.value || '500', 10);

  const influxVal = document.getElementById('queue-val-influx');
  const tpsVal = document.getElementById('queue-val-tps');
  if (influxVal) influxVal.textContent = influx.toLocaleString('en-IN');
  if (tpsVal) tpsVal.textContent = `${tps} TPS`;

  fqState.totalQueued = influx;
  fqState.originCapacityTps = tps;
  fqState.admittedPerSec = tps;
  fqState.originCpuPct = Math.min(95, Math.floor((tps / 1000) * 80) + 15);
  fqState.userPosition = Math.max(1, Math.floor(influx * 0.04));
  fqState.userWaitSecs = Math.max(10, Math.floor((fqState.userPosition / tps) * 60));

  renderFqMetrics();
  renderFqUserCard();
  renderFqTelemetry(`Configuration updated: ${influx.toLocaleString('en-IN')} users, ${tps} TPS origin limit.`);
}

function renderFqMetrics() {
  const qEl = document.getElementById('queue-metric-queued');
  const tEl = document.getElementById('queue-metric-tps');
  const aEl = document.getElementById('queue-metric-abandon');
  const cEl = document.getElementById('queue-metric-cpu');

  if (qEl) qEl.textContent = fqState.totalQueued.toLocaleString('en-IN');
  if (tEl) tEl.textContent = `${fqState.admittedPerSec} / sec`;
  if (aEl) aEl.textContent = `${fqState.abandonmentRatePct}%`;
  if (cEl) cEl.textContent = `${fqState.originCpuPct}%`;
}

function renderFqUserCard() {
  const posEl = document.getElementById('queue-user-position');
  const waitEl = document.getElementById('queue-user-wait');
  const tokenEl = document.getElementById('queue-user-token');
  const barEl = document.getElementById('queue-user-progress-bar');

  if (posEl) posEl.textContent = `#${fqState.userPosition.toLocaleString('en-IN')}`;
  if (waitEl) {
    const m = Math.floor(fqState.userWaitSecs / 60);
    const s = fqState.userWaitSecs % 60;
    waitEl.textContent = `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  if (tokenEl) tokenEl.textContent = `TK-PASS-${Math.abs(fqState.userPosition * 19) % 99999}`;
  if (barEl) {
    const pct = Math.max(8, Math.min(98, 100 - Math.floor((fqState.userPosition / fqState.totalQueued) * 100)));
    barEl.style.width = `${pct}%`;
  }
}

function injectSurgeTraffic() {
  fqState.totalQueued += 10000;
  fqState.userPosition += 350;
  fqState.userWaitSecs += 25;
  fqState.originCpuPct = Math.min(94, fqState.originCpuPct + 8);

  renderFqMetrics();
  renderFqUserCard();
  renderFqTelemetry('+10,000 users buffered into token bucket waiting room.');

  if (window.showToast) window.showToast('+10,000 incoming users buffered at Edge', 'info');
}

function drainQueueStep() {
  const batch = Math.min(fqState.totalQueued, fqState.admittedPerSec * 2);
  fqState.totalQueued = Math.max(0, fqState.totalQueued - batch);
  fqState.userPosition = Math.max(1, fqState.userPosition - Math.floor(batch * 0.4));
  fqState.userWaitSecs = Math.max(5, fqState.userWaitSecs - 15);
  fqState.originCpuPct = Math.max(45, fqState.originCpuPct - 3);

  renderFqMetrics();
  renderFqUserCard();
  renderFqTelemetry(`Released batch of ${batch.toLocaleString('en-IN')} users to origin checkout.`);

  if (fqState.userPosition <= 10) {
    if (window.showToast) window.showToast('Front of queue reached. Checkout gate access granted.', 'success');
  } else if (window.showToast) {
    window.showToast(`Admitted ${batch.toLocaleString('en-IN')} users to origin`, 'success');
  }
}

function renderFqTelemetry(note = '') {
  const container = document.getElementById('queue-telemetry-log');
  if (!container) return;

  const now = new Date().toLocaleTimeString();
  const logs = [
    { time: now, step: 'EDGE', msg: note || 'Waiting room telemetry nominal.' },
    { time: now, step: 'AUTH', msg: `HMAC token validation active. Zero forged tickets admitted.` },
    { time: now, step: 'BOT_DEFENSE', msg: `${fqState.botQuarantined.toLocaleString('en-IN')} anomalous requests routed to Captcha challenge.` },
    { time: now, step: 'ORIGIN', msg: `PostgreSQL connection pool: 44 of 100 active connections. Zero 504 errors.` }
  ];

  container.innerHTML = logs.map(l => `
    <div class="flex items-start gap-2.5 py-1.5 border-b border-rule font-mono text-xs">
      <span class="text-muted w-16">${l.time}</span>
      <span class="chip chip-cool">${l.step}</span>
      <span class="text-ink-2 flex-1">${escapeHtml(l.msg)}</span>
    </div>
  `).join('');
}

window.selectQueueScenario = selectQueueScenario;
window.updateQueueInputs = updateQueueInputs;
window.injectSurgeTraffic = injectSurgeTraffic;
window.drainQueueStep = drainQueueStep;
