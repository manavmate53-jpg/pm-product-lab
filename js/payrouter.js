// Product 4: Multi-Gateway Payment Router & Instant Refund Reconciliation Engine
// 100% client-side deterministic simulation of smart cascade fallback, MDR optimization, and refund idempotency

let paymentScenarios = { gateways: [], presets: [] };
let selectedPaymentPreset = null;
let currentGatewayHealth = {
  cashfree: { status: 'Optimal', p95LatencyMs: 185, successRate: 98.4 },
  razorpay: { status: 'Degraded', p95LatencyMs: 1420, successRate: 89.2 },
  stripe: { status: 'Optimal', p95LatencyMs: 220, successRate: 99.1 },
  payu: { status: 'Healthy', p95LatencyMs: 340, successRate: 94.6 }
};

document.addEventListener('DOMContentLoaded', () => {
  loadPaymentScenarios();
});

async function loadPaymentScenarios() {
  try {
    const res = await fetch('data/payment-scenarios.json');
    paymentScenarios = await res.json();
    if (paymentScenarios.presets && paymentScenarios.presets.length > 0) {
      selectPaymentPreset(paymentScenarios.presets[0].id);
    }
  } catch (err) {
    console.error('Failed to load payment scenarios:', err);
  }
}

function selectPaymentPreset(presetId) {
  const preset = paymentScenarios.presets.find(p => p.id === presetId);
  if (!preset) return;
  selectedPaymentPreset = preset;

  // Highlight preset button
  paymentScenarios.presets.forEach(p => {
    const btn = document.getElementById(`pay-preset-btn-${p.id}`);
    if (btn) {
      if (p.id === presetId) {
        btn.classList.add('border-emerald-500', 'bg-emerald-950/40', 'text-emerald-300');
        btn.classList.remove('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      } else {
        btn.classList.remove('border-emerald-500', 'bg-emerald-950/40', 'text-emerald-300');
        btn.classList.add('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      }
    }
  });

  // Populate inputs
  const amountInput = document.getElementById('pay-input-amount');
  const methodSelect = document.getElementById('pay-input-method');
  const healthSelect = document.getElementById('pay-input-bank-health');
  const strategySelect = document.getElementById('pay-input-strategy');

  if (amountInput) amountInput.value = preset.amountInr;
  if (methodSelect) methodSelect.value = preset.paymentMethod;
  if (healthSelect) healthSelect.value = preset.simulatedBankHealth;
  if (strategySelect) strategySelect.value = preset.routingStrategy;

  // Render Gateway Health Matrix
  renderGatewayHealthCards(preset.simulatedBankHealth);

  // Run execution simulation
  executePaymentRouting(false);
}

function renderGatewayHealthCards(healthState) {
  const container = document.getElementById('pay-gateway-health-grid');
  if (!container) return;

  // Adjust health according to simulatedBankHealth
  if (healthState === 'degraded_hdfc') {
    currentGatewayHealth.razorpay = { status: 'Degraded', p95LatencyMs: 1420, successRate: 88.5 };
    currentGatewayHealth.cashfree = { status: 'Optimal', p95LatencyMs: 185, successRate: 98.8 };
  } else {
    currentGatewayHealth.razorpay = { status: 'Healthy', p95LatencyMs: 310, successRate: 95.8 };
    currentGatewayHealth.cashfree = { status: 'Optimal', p95LatencyMs: 190, successRate: 98.5 };
  }

  container.innerHTML = paymentScenarios.gateways.map(gw => {
    const current = currentGatewayHealth[gw.id] || gw;
    const isOptimal = current.status === 'Optimal';
    const isDegraded = current.status === 'Degraded';
    const badgeColor = isOptimal ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800' :
                       isDegraded ? 'text-rose-400 bg-rose-950/80 border-rose-800' :
                       'text-blue-400 bg-blue-950/80 border-blue-800';

    return `
      <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <span class="text-xs font-bold text-white">${gw.name}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}">${current.status}</span>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
          <div>P95: <span class="text-slate-200">${current.p95LatencyMs}ms</span></div>
          <div>Success: <span class="text-slate-200">${current.successRate}%</span></div>
          <div>Card MDR: <span class="text-slate-200">${gw.baseCardMdr}%</span></div>
          <div>UPI MDR: <span class="text-slate-200">0.00%</span></div>
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

  renderGatewayHealthCards(health);

  // Deterministic routing decisions
  let selectedPrimary = 'cashfree';
  let failover = null;
  let reason = '';
  let mdrBps = 15;
  let latency = 185;
  let waterfallLogs = [];

  const timestamp = new Date().toISOString();
  const idempotencyKey = 'idemp_pay_' + Math.floor(100000 + Math.random() * 900000);

  waterfallLogs.push({ step: 'INITIATED', timeMs: 0, text: `Received payment intent: ₹${amount.toLocaleString('en-IN')} via ${method.toUpperCase()}` });
  waterfallLogs.push({ step: 'RISK_EVAL', timeMs: 24, text: `Fraud heuristic check passed (score: 0.02, card velocity: 1 tx/hr)` });

  if (method === 'card_intl') {
    selectedPrimary = 'stripe';
    reason = 'Cross-border card detected. Stripe selected for international BIN optimization and 45 bps lower interchange fees.';
    mdrBps = 45;
    latency = 215;
    waterfallLogs.push({ step: 'ROUTING_RULE', timeMs: 62, text: `Rule match: INTERNATIONAL_CARD -> Direct routing to Stripe India Rail` });
    waterfallLogs.push({ step: 'GATEWAY_EXEC', timeMs: 140, text: `Stripe 3DS 2.2 challenge verification completed` });
    waterfallLogs.push({ step: 'SETTLED', timeMs: latency, text: `Transaction settled: ₹${amount.toLocaleString('en-IN')} (Auth code: auth_99214)` });
  } else if (health === 'degraded_hdfc' && method === 'upi') {
    selectedPrimary = 'cashfree';
    failover = 'razorpay';
    reason = 'Razorpay UPI rail latency spiked to 1,420ms with 11.5% drop rate. Router auto-cascaded to Cashfree rail.';
    mdrBps = 15;
    latency = 185;
    waterfallLogs.push({ step: 'ROUTING_RULE', timeMs: 48, text: `Primary probe: Razorpay latency 1,420ms > 800ms threshold` });
    waterfallLogs.push({ step: 'CASCADE_TRIGGER', timeMs: 82, text: `Failover activated -> Re-routed payload to Cashfree UPI engine` });
    waterfallLogs.push({ step: 'NPCI_ACK', timeMs: 145, text: `NPCI UPI Switch accepted intent for merchant.test@okhdfcbank` });
    waterfallLogs.push({ step: 'SETTLED', timeMs: latency, text: `Transaction completed in 185ms with zero customer drop-off` });
  } else {
    selectedPrimary = 'cashfree';
    reason = strategy === 'cost_optimization' ? 'Lowest negotiated merchant discount rate (MDR) tier selected.' : 'Optimal health gateway selected.';
    mdrBps = 20;
    latency = 195;
    waterfallLogs.push({ step: 'ROUTING_RULE', timeMs: 50, text: `Strategy match: ${strategy.toUpperCase()} -> Selected Cashfree rail` });
    waterfallLogs.push({ step: 'SETTLED', timeMs: latency, text: `Transaction settled successfully in ${latency}ms` });
  }

  // Calculate savings vs flat 2.0% MDR
  const standardFeeInr = (amount * 0.020).toFixed(2);
  const optimizedFeeInr = (amount * (0.020 - (mdrBps / 10000))).toFixed(2);
  const savedFeeInr = (parseFloat(standardFeeInr) - parseFloat(optimizedFeeInr)).toFixed(2);

  // Update Summary DOM
  const outPrimary = document.getElementById('pay-out-primary');
  const outLatency = document.getElementById('pay-out-latency');
  const outSavings = document.getElementById('pay-out-savings');
  const outReason = document.getElementById('pay-out-reason');

  if (outPrimary) outPrimary.textContent = selectedPrimary === 'cashfree' ? 'Cashfree Payments (Optimal)' : 'Stripe India (Optimal)';
  if (outLatency) outLatency.textContent = `${latency}ms`;
  if (outSavings) outSavings.textContent = `₹${savedFeeInr} saved (${mdrBps} bps discount)`;
  if (outReason) outReason.textContent = reason;

  // Render Waterfall
  const waterfallContainer = document.getElementById('pay-waterfall-log');
  if (waterfallContainer) {
    waterfallContainer.innerHTML = waterfallLogs.map(log => `
      <div class="flex items-start gap-3 py-1.5 border-b border-slate-800/60 font-mono text-xs">
        <span class="text-blue-400 font-semibold w-16 text-right">${log.timeMs}ms</span>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">${log.step}</span>
        <span class="text-slate-300 flex-1">${log.text}</span>
      </div>
    `).join('');
  }

  // Update JSON Payload Display
  const payloadEl = document.getElementById('pay-json-payload');
  if (payloadEl) {
    const payload = {
      event: "payment.routed",
      timestamp: timestamp,
      idempotency_key: idempotencyKey,
      transaction: {
        amount_inr: amount,
        payment_method: method,
        status: "SUCCESS"
      },
      routing_decision: {
        strategy: strategy,
        selected_gateway: selectedPrimary,
        failover_source: failover,
        p95_latency_ms: latency,
        mdr_cost_savings_inr: parseFloat(savedFeeInr)
      },
      settlement: {
        reconciliation_status: "MATCHED_100%",
        webhook_acknowledged: true,
        instant_refund_ready: true
      }
    };
    payloadEl.textContent = JSON.stringify(payload, null, 2);
  }

  if (triggerToast && window.showToast) {
    window.showToast(`Transaction routed via ${selectedPrimary.toUpperCase()} in ${latency}ms`, 'success');
  }
}

function executeInstantRefundSimulation() {
  const amount = parseFloat(document.getElementById('pay-input-amount')?.value || '3200');
  const refundId = 'rfnd_' + Math.floor(100000 + Math.random() * 900000);
  const idempotencyKey = 'idemp_rfnd_lock_' + Math.floor(1000 + Math.random() * 9000);

  const payloadEl = document.getElementById('pay-json-payload');
  if (payloadEl) {
    const refundPayload = {
      event: "refund.instant_settled",
      timestamp: new Date().toISOString(),
      refund_id: refundId,
      idempotency_lock: idempotencyKey,
      refund_status: "SUCCESS",
      reconciliation: {
        original_debit_verified: true,
        ledger_double_debit_blocked: true,
        amount_inr: amount,
        payout_rail: "UPI_IMMEDIATE_SETTLEMENT",
        turnaround_latency_ms: 120,
        merchant_reserve_balance: "SUFFICIENT"
      }
    };
    payloadEl.textContent = JSON.stringify(refundPayload, null, 2);
  }

  const outReason = document.getElementById('pay-out-reason');
  if (outReason) {
    outReason.textContent = `Instant refund ₹${amount} executed. Automated idempotency lock verified zero double refund.`;
  }

  if (window.showToast) {
    window.showToast(`Instant refund ₹${amount} processed in 120ms with zero double-debit`, 'success');
  }
}

// Window export for app navigation
window.executePaymentRouting = executePaymentRouting;
window.selectPaymentPreset = selectPaymentPreset;
window.executeInstantRefundSimulation = executeInstantRefundSimulation;
