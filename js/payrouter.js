// Product 4: PayRouter Multi-Gateway Payment Router & Instant Refund Engine
// Dynamic routing, bank health degradation cascade, and cryptographic refund idempotency

let prGateways = [];
let prPresets = [];
let prSelectedPreset = null;
let prCurrentHealth = {
  cashfree: { status: 'Optimal', p95: 185, success: 98.4 },
  razorpay: { status: 'Degraded', p95: 1420, success: 89.2 },
  stripe: { status: 'Optimal', p95: 220, success: 99.1 },
  payu: { status: 'Healthy', p95: 340, success: 94.6 }
};

document.addEventListener('DOMContentLoaded', () => {
  initPayRouter();
});

function initPayRouter() {
  if (window.LabData && window.LabData.payment) {
    prGateways = window.LabData.payment.gateways || [];
    prPresets = window.LabData.payment.presets || [];
  }
  if (prPresets.length > 0) {
    selectPaymentPreset(prPresets[0].id);
  }
}

function selectPaymentPreset(presetId) {
  const p = prPresets.find(item => item.id === presetId);
  if (!p) return;
  prSelectedPreset = p;

  prPresets.forEach(preset => {
    const btn = document.getElementById(`pay-preset-btn-${preset.id}`);
    if (btn) {
      if (preset.id === presetId) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  const amountInput = document.getElementById('pay-input-amount');
  const methodSelect = document.getElementById('pay-input-method');
  const healthSelect = document.getElementById('pay-input-bank-health');
  const strategySelect = document.getElementById('pay-input-strategy');

  if (amountInput) amountInput.value = p.amountInr;
  if (methodSelect) methodSelect.value = p.paymentMethod;
  if (healthSelect) healthSelect.value = p.simulatedBankHealth;
  if (strategySelect) strategySelect.value = p.routingStrategy;

  renderGatewayMatrix(p.simulatedBankHealth);
  executePaymentRouting(false);
}

function renderGatewayMatrix(healthState) {
  const container = document.getElementById('pay-gateway-health-grid');
  if (!container) return;

  if (healthState === 'degraded_hdfc') {
    prCurrentHealth.razorpay = { status: 'Degraded', p95: 1420, success: 88.5 };
    prCurrentHealth.cashfree = { status: 'Optimal', p95: 185, success: 98.8 };
  } else {
    prCurrentHealth.razorpay = { status: 'Healthy', p95: 310, success: 95.8 };
    prCurrentHealth.cashfree = { status: 'Optimal', p95: 190, success: 98.5 };
  }

  container.innerHTML = prGateways.map(gw => {
    const curr = prCurrentHealth[gw.id] || { status: gw.status, p95: gw.p95LatencyMs, success: gw.successRate };
    const chipClass = curr.status === 'Optimal' ? 'chip-ok' : (curr.status === 'Degraded' ? 'chip-bad' : 'chip-cool');

    return `
      <div class="panel p-3 flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-ink">${escapeHtml(gw.name)}</span>
          <span class="chip ${chipClass}">${curr.status}</span>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-1.5 text-xs font-mono text-muted">
          <div>P95: <span class="text-ink">${curr.p95}ms</span></div>
          <div>Success: <span class="text-ink">${curr.success}%</span></div>
          <div>Card MDR: <span class="text-ink">${gw.baseCardMdr}%</span></div>
          <div>UPI MDR: <span class="text-ink">0.00%</span></div>
        </div>
      </div>
    `;
  }).join('');
}

function executePaymentRouting(triggerToast = true) {
  const amount = parseFloat(document.getElementById('pay-input-amount')?.value || '1499');
  const method = document.getElementById('pay-input-method')?.value || 'upi';
  const health = document.getElementById('pay-input-bank-health')?.value || 'degraded_hdfc';
  const strategy = document.getElementById('pay-input-strategy')?.value || 'success_rate';

  renderGatewayMatrix(health);

  let primary = 'cashfree';
  let failover = null;
  let reason = '';
  let mdrBps = 15;
  let latency = 185;
  let waterfall = [];

  waterfall.push({ step: 'INITIATED', timeMs: 0, text: `Received intent: ₹${amount.toLocaleString('en-IN')} via ${method.toUpperCase()}` });
  waterfall.push({ step: 'RISK_EVAL', timeMs: 24, text: 'Fraud velocity heuristic check passed' });

  if (method === 'card_intl') {
    primary = 'stripe';
    reason = 'International card BIN detected. Routed to Stripe to reduce cross-border interchange by 45 bps.';
    mdrBps = 45;
    latency = 215;
    waterfall.push({ step: 'ROUTING_RULE', timeMs: 62, text: 'Rule: INTERNATIONAL_CARD -> Stripe India Rail' });
    waterfall.push({ step: '3DS_VERIFY', timeMs: 140, text: '3DS 2.2 challenge verified' });
    waterfall.push({ step: 'SETTLED', timeMs: latency, text: 'Settlement confirmed' });
  } else if (health === 'degraded_hdfc' && method === 'upi') {
    primary = 'cashfree';
    failover = 'razorpay';
    reason = 'Razorpay UPI rail latency spiked to 1,420ms (>800ms threshold). Router cascaded intent to Cashfree rail.';
    mdrBps = 15;
    latency = 185;
    waterfall.push({ step: 'PROBE_CHECK', timeMs: 48, text: 'Razorpay UPI latency 1,420ms > threshold' });
    waterfall.push({ step: 'CASCADE_TRIGGER', timeMs: 82, text: 'Failover triggered: re-routed to Cashfree UPI rail' });
    waterfall.push({ step: 'NPCI_ACK', timeMs: 145, text: 'NPCI UPI Switch accepted intent' });
    waterfall.push({ step: 'SETTLED', timeMs: latency, text: 'Settled with zero customer drop-off' });
  } else {
    primary = 'cashfree';
    reason = strategy === 'cost_optimization' ? 'Lowest negotiated MDR rate selected.' : 'Optimal health gateway selected.';
    mdrBps = 20;
    latency = 195;
    waterfall.push({ step: 'ROUTING_RULE', timeMs: 50, text: `Strategy match: ${strategy.toUpperCase()} -> Cashfree` });
    waterfall.push({ step: 'SETTLED', timeMs: latency, text: `Settled in ${latency}ms` });
  }

  const savedFee = (amount * (mdrBps / 10000)).toFixed(2);

  const outPrimary = document.getElementById('pay-out-primary');
  const outLatency = document.getElementById('pay-out-latency');
  const outSavings = document.getElementById('pay-out-savings');
  const outReason = document.getElementById('pay-out-reason');

  if (outPrimary) outPrimary.textContent = primary === 'cashfree' ? 'Cashfree Payments (Optimal)' : 'Stripe India (Optimal)';
  if (outLatency) outLatency.textContent = `${latency}ms`;
  if (outSavings) outSavings.textContent = `₹${savedFee} saved (${mdrBps} bps discount)`;
  if (outReason) outReason.textContent = reason;

  const waterfallEl = document.getElementById('pay-waterfall-log');
  if (waterfallEl) {
    waterfallEl.innerHTML = waterfall.map(log => `
      <div class="flex items-start gap-2.5 py-1.5 border-b border-rule font-mono text-xs">
        <span class="text-cool w-14 text-right">${log.timeMs}ms</span>
        <span class="chip chip-cool">${log.step}</span>
        <span class="text-ink-2 flex-1">${log.text}</span>
      </div>
    `).join('');
  }

  const payloadEl = document.getElementById('pay-json-payload');
  if (payloadEl) {
    const payload = {
      event: "payment.routed",
      timestamp: new Date().toISOString(),
      idempotency_key: "idemp_pay_" + Math.floor(100000 + Math.random() * 900000),
      transaction: { amount_inr: amount, method: method, status: "SUCCESS" },
      routing: { selected_gateway: primary, failover: failover, p95_latency_ms: latency, mdr_savings_inr: parseFloat(savedFee) },
      reconciliation: { status: "MATCHED_100%", instant_refund_eligible: true }
    };
    payloadEl.textContent = JSON.stringify(payload, null, 2);
  }

  if (triggerToast && window.showToast) {
    window.showToast(`Routed via ${primary.toUpperCase()} in ${latency}ms`, 'success');
  }
}

function executeInstantRefundSimulation() {
  const amount = parseFloat(document.getElementById('pay-input-amount')?.value || '1499');
  const refundId = 'rfnd_' + Math.floor(100000 + Math.random() * 900000);
  const idempotencyKey = 'idemp_rfnd_lock_' + Math.floor(1000 + Math.random() * 9000);

  const payloadEl = document.getElementById('pay-json-payload');
  if (payloadEl) {
    const refundPayload = {
      event: "refund.instant_settled",
      timestamp: new Date().toISOString(),
      refund_id: refundId,
      idempotency_lock: idempotencyKey,
      status: "SUCCESS",
      reconciliation: {
        original_debit_verified: true,
        double_debit_blocked: true,
        amount_inr: amount,
        payout_rail: "UPI_IMMEDIATE_SETTLEMENT",
        turnaround_latency_ms: 118
      }
    };
    payloadEl.textContent = JSON.stringify(refundPayload, null, 2);
  }

  const outReason = document.getElementById('pay-out-reason');
  if (outReason) {
    outReason.textContent = `Instant refund ₹${amount} executed. Automated idempotency lock verified zero double refund.`;
  }

  if (window.showToast) {
    window.showToast(`Instant refund ₹${amount} processed in 118ms`, 'success');
  }
}

window.selectPaymentPreset = selectPaymentPreset;
window.executePaymentRouting = executePaymentRouting;
window.executeInstantRefundSimulation = executeInstantRefundSimulation;
