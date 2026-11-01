// Product 5: High-Concurrency Virtual Waiting Room & Flash Queue Simulator
// Client-side deterministic simulation of token bucket queueing, bot defense, and adaptive backpressure

let queueScenarios = { scenarios: [] };
let selectedQueueScenario = null;
let currentQueueState = {
  totalQueued: 50000,
  admittedPerSec: 500,
  originCapacityTps: 500,
  abandonmentRatePct: 4.6,
  originCpuPct: 68,
  activeTokenPasses: 1420,
  userPosition: 1428,
  userWaitSecs: 134,
  botQuarantined: 4000
};

let queueDrainInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadQueueScenarios();
});

async function loadQueueScenarios() {
  try {
    const res = await fetch('data/queue-scenarios.json');
    queueScenarios = await res.json();
    if (queueScenarios.scenarios && queueScenarios.scenarios.length > 0) {
      selectQueueScenario(queueScenarios.scenarios[0].id);
    }
  } catch (err) {
    console.error('Failed to load queue scenarios:', err);
  }
}

function selectQueueScenario(scenarioId) {
  const scenario = queueScenarios.scenarios.find(s => s.id === scenarioId);
  if (!scenario) return;
  selectedQueueScenario = scenario;

  // Highlight buttons
  queueScenarios.scenarios.forEach(s => {
    const btn = document.getElementById(`queue-preset-btn-${s.id}`);
    if (btn) {
      if (s.id === scenarioId) {
        btn.classList.add('border-pink-500', 'bg-pink-950/40', 'text-pink-300');
        btn.classList.remove('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      } else {
        btn.classList.remove('border-pink-500', 'bg-pink-950/40', 'text-pink-300');
        btn.classList.add('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      }
    }
  });

  // Populate inputs
  const influxInput = document.getElementById('queue-input-influx');
  const tpsInput = document.getElementById('queue-input-tps');
  const algoSelect = document.getElementById('queue-input-algo');
  const influxVal = document.getElementById('queue-val-influx');
  const tpsVal = document.getElementById('queue-val-tps');

  if (influxInput) influxInput.value = scenario.influxUsers;
  if (tpsInput) tpsInput.value = scenario.originTpsLimit;
  if (algoSelect) algoSelect.value = scenario.queueAlgorithm;
  if (influxVal) influxVal.textContent = scenario.influxUsers.toLocaleString('en-IN');
  if (tpsVal) tpsVal.textContent = `${scenario.originTpsLimit} TPS`;

  // Set internal state
  currentQueueState.totalQueued = scenario.influxUsers;
  currentQueueState.originCapacityTps = scenario.originTpsLimit;
  currentQueueState.admittedPerSec = scenario.expectedTokensPerSec;
  currentQueueState.abandonmentRatePct = scenario.simulatedDropoffRate;
  currentQueueState.originCpuPct = scenario.originCpuLoadPct;
  currentQueueState.userPosition = Math.floor(scenario.influxUsers * 0.03) + 420;
  currentQueueState.userWaitSecs = scenario.averageWaitSeconds;
  currentQueueState.botQuarantined = Math.floor(scenario.influxUsers * (scenario.botPercentage / 100));

  renderQueueMetrics();
  renderQueueUserCard();
  renderQueueTelemetryLogs(scenario.statusMessage);
}

function updateQueueInputs() {
  const influx = parseInt(document.getElementById('queue-input-influx')?.value || '50000', 10);
  const tps = parseInt(document.getElementById('queue-input-tps')?.value || '500', 10);
  const algo = document.getElementById('queue-input-algo')?.value || 'token_bucket_fifo';

  const influxVal = document.getElementById('queue-val-influx');
  const tpsVal = document.getElementById('queue-val-tps');
  if (influxVal) influxVal.textContent = influx.toLocaleString('en-IN');
  if (tpsVal) tpsVal.textContent = `${tps} TPS`;

  currentQueueState.totalQueued = influx;
  currentQueueState.originCapacityTps = tps;
  currentQueueState.admittedPerSec = tps;
  currentQueueState.originCpuPct = Math.min(95, Math.floor((tps / 1000) * 80) + 15);
  currentQueueState.userPosition = Math.floor(influx * 0.04);
  currentQueueState.userWaitSecs = Math.max(12, Math.floor(currentQueueState.userPosition / tps * 60));

  renderQueueMetrics();
  renderQueueUserCard();
  renderQueueTelemetryLogs(`Updated queue configuration: Influx ${influx.toLocaleString('en-IN')} users, origin limit ${tps} TPS.`);
}

function renderQueueMetrics() {
  const queuedEl = document.getElementById('queue-metric-queued');
  const tpsEl = document.getElementById('queue-metric-tps');
  const abandonEl = document.getElementById('queue-metric-abandon');
  const cpuEl = document.getElementById('queue-metric-cpu');

  if (queuedEl) queuedEl.textContent = currentQueueState.totalQueued.toLocaleString('en-IN');
  if (tpsEl) tpsEl.textContent = `${currentQueueState.admittedPerSec} / sec`;
  if (abandonEl) abandonEl.textContent = `${currentQueueState.abandonmentRatePct}%`;
  if (cpuEl) cpuEl.textContent = `${currentQueueState.originCpuPct}%`;
}

function renderQueueUserCard() {
  const posEl = document.getElementById('queue-user-position');
  const waitEl = document.getElementById('queue-user-wait');
  const passEl = document.getElementById('queue-user-token');
  const progressEl = document.getElementById('queue-user-progress-bar');

  if (posEl) posEl.textContent = `#${currentQueueState.userPosition.toLocaleString('en-IN')}`;
  if (waitEl) {
    const mins = Math.floor(currentQueueState.userWaitSecs / 60);
    const secs = currentQueueState.userWaitSecs % 60;
    waitEl.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  if (passEl) passEl.textContent = `TK-PASS-${Math.abs(currentQueueState.userPosition * 17) % 99999}`;

  if (progressEl) {
    const pct = Math.max(8, Math.min(98, 100 - Math.floor((currentQueueState.userPosition / currentQueueState.totalQueued) * 100)));
    progressEl.style.width = `${pct}%`;
  }
}

function injectSurgeTraffic() {
  currentQueueState.totalQueued += 10000;
  currentQueueState.userPosition += 350;
  currentQueueState.userWaitSecs += 25;
  currentQueueState.originCpuPct = Math.min(94, currentQueueState.originCpuPct + 8);

  renderQueueMetrics();
  renderQueueUserCard();
  renderQueueTelemetryLogs('Surge spike: +10,000 incoming users absorbed into token bucket buffer.');

  if (window.showToast) {
    window.showToast('+10,000 users buffered smoothly into waiting room queue', 'info');
  }
}

function drainQueueStep() {
  const step = Math.min(currentQueueState.totalQueued, currentQueueState.admittedPerSec * 2);
  currentQueueState.totalQueued = Math.max(0, currentQueueState.totalQueued - step);
  currentQueueState.userPosition = Math.max(1, currentQueueState.userPosition - Math.floor(step * 0.4));
  currentQueueState.userWaitSecs = Math.max(5, currentQueueState.userWaitSecs - 15);
  currentQueueState.originCpuPct = Math.max(45, currentQueueState.originCpuPct - 3);

  renderQueueMetrics();
  renderQueueUserCard();
  renderQueueTelemetryLogs(`Admitted batch: ${step.toLocaleString('en-IN')} users released to origin checkout.`);

  if (currentQueueState.userPosition <= 10) {
    if (window.showToast) {
      window.showToast('You have reached the front of the queue! Checkout gate unlocked.', 'success');
    }
  } else if (window.showToast) {
    window.showToast(`Drained ${step.toLocaleString('en-IN')} users from waiting room`, 'success');
  }
}

function renderQueueTelemetryLogs(customNote = '') {
  const container = document.getElementById('queue-telemetry-log');
  if (!container) return;

  const now = new Date().toLocaleTimeString();
  const logs = [
    { time: now, level: 'INFO', msg: customNote || 'Queue telemetry nominal.' },
    { time: now, level: 'EDGE', msg: `Cloudflare Worker token validation: verified HMAC signatures on 1,420 checkout tokens.` },
    { time: now, level: 'SECURITY', msg: `Bot heuristic defense: ${currentQueueState.botQuarantined.toLocaleString('en-IN')} suspicious requests assigned to Captcha challenge room.` },
    { time: now, level: 'ORIGIN', msg: `PostgreSQL connection pool status: 42 of 100 active connections. Zero 504 gateway timeouts recorded.` }
  ];

  container.innerHTML = logs.map(l => `
    <div class="flex items-start gap-2.5 py-1.5 border-b border-slate-800/60 font-mono text-xs">
      <span class="text-slate-500 w-16">${l.time}</span>
      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${l.level === 'SECURITY' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}">${l.level}</span>
      <span class="text-slate-300 flex-1">${l.msg}</span>
    </div>
  `).join('');
}

// Window exports
window.selectQueueScenario = selectQueueScenario;
window.updateQueueInputs = updateQueueInputs;
window.injectSurgeTraffic = injectSurgeTraffic;
window.drainQueueStep = drainQueueStep;
