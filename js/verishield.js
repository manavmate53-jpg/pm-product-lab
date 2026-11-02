// Product 1: VeriShield B2B KYC & Document Risk Engine
// Deterministic validation, fuzzy string matching, document tampering analysis, and audit logging

let vsCurrentScenario = null;
let vsScenarios = [];
let vsAuditLogs = [
  { time: "10:14:22", merchant: "Apex Industrial Logistics", action: "AUTO_APPROVED", score: 96, actor: "Rules Engine v2.4", status: "APPROVED" },
  { time: "09:42:05", merchant: "Falcon Global Tech", action: "ROUTED_MANUAL_QUEUE", score: 72, actor: "Threshold Guard", status: "IN_REVIEW" }
];

document.addEventListener('DOMContentLoaded', () => {
  initVeriShield();
});

function initVeriShield() {
  if (window.LabData && window.LabData.kyc && window.LabData.kyc.scenarios) {
    vsScenarios = window.LabData.kyc.scenarios;
  }
  setupVsListeners();
  if (vsScenarios.length > 0) {
    selectVsScenario(vsScenarios[0].id);
  }
  renderVsAuditLogs();
}

function setupVsListeners() {
  ['vs-gstin', 'vs-pan', 'vs-gst-name', 'vs-bank-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', runVsValidation);
  });
}

function selectVsScenario(scenarioId) {
  const sc = vsScenarios.find(s => s.id === scenarioId);
  if (!sc) return;
  vsCurrentScenario = sc;

  ['scenario-a', 'scenario-b', 'scenario-c'].forEach(id => {
    const btn = document.getElementById(`vs-preset-${id}`);
    if (btn) {
      if (id === scenarioId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  const gstinInput = document.getElementById('vs-gstin');
  const panInput = document.getElementById('vs-pan');
  const gstNameInput = document.getElementById('vs-gst-name');
  const bankNameInput = document.getElementById('vs-bank-name');
  const turnoverInput = document.getElementById('vs-turnover');
  const tamperSelect = document.getElementById('vs-tamper');

  if (gstinInput) gstinInput.value = sc.gstin;
  if (panInput) panInput.value = sc.pan;
  if (gstNameInput) gstNameInput.value = sc.gstName;
  if (bankNameInput) bankNameInput.value = sc.bankName;
  if (turnoverInput) turnoverInput.value = sc.annualTurnover;
  if (tamperSelect) tamperSelect.value = sc.docMetadata.tamperingDetected ? 'tampered' : 'clean';

  runVsValidation();
  resetVsPipelineUI(sc);
}

function runVsValidation() {
  const gstin = (document.getElementById('vs-gstin')?.value || '').trim().toUpperCase();
  const pan = (document.getElementById('vs-pan')?.value || '').trim().toUpperCase();
  const gstName = (document.getElementById('vs-gst-name')?.value || '').trim();
  const bankName = (document.getElementById('vs-bank-name')?.value || '').trim();

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isGstinValid = gstinRegex.test(gstin);

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanValid = panRegex.test(pan);

  let isCrossMatch = false;
  if (gstin.length >= 12 && pan.length === 10) {
    isCrossMatch = (gstin.substring(2, 12) === pan);
  }

  const similarity = calcLevenshtein(gstName, bankName);

  setVsChip('pill-gstin-status', isGstinValid ? 'Valid GSTIN' : 'Invalid GSTIN', isGstinValid ? 'chip-ok' : 'chip-bad');
  setVsChip('pill-pan-status', isPanValid ? 'Valid PAN' : 'Invalid PAN', isPanValid ? 'chip-ok' : 'chip-bad');
  setVsChip('pill-cross-match', isCrossMatch ? 'PAN Matched' : 'PAN Discrepancy', isCrossMatch ? 'chip-ok' : 'chip-bad');

  let simClass = 'chip-bad';
  if (similarity >= 90) simClass = 'chip-ok';
  else if (similarity >= 65) simClass = 'chip-accent';
  setVsChip('pill-similarity', `${similarity}% Name Match`, simClass);

  return { isGstinValid, isPanValid, isCrossMatch, similarity, gstin, pan, gstName, bankName };
}

function setVsChip(id, text, chipClass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `chip ${chipClass}`;
}

function calcLevenshtein(s1, s2) {
  if (!s1 || !s2) return 0;
  const c1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const c2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c1 === c2) return 100;
  if (!c1.length || !c2.length) return 0;

  const dp = Array(c2.length + 1).fill(null).map(() => Array(c1.length + 1).fill(null));
  for (let i = 0; i <= c1.length; i++) dp[0][i] = i;
  for (let j = 0; j <= c2.length; j++) dp[j][0] = j;

  for (let j = 1; j <= c2.length; j++) {
    for (let i = 1; i <= c1.length; i++) {
      const cost = c1[i - 1] === c2[j - 1] ? 0 : 1;
      dp[j][i] = Math.min(dp[j][i - 1] + 1, dp[j - 1][i] + 1, dp[j - 1][i - 1] + cost);
    }
  }

  const dist = dp[c2.length][c1.length];
  const maxL = Math.max(c1.length, c2.length);
  return Math.round(((maxL - dist) / maxL) * 100);
}

function resetVsPipelineUI(sc) {
  const scoreNum = document.getElementById('vs-score-num');
  const badge = document.getElementById('vs-decision-badge');
  const runBtn = document.getElementById('vs-run-btn');

  if (scoreNum) scoreNum.textContent = '--';
  if (badge) {
    badge.textContent = 'Awaiting run';
    badge.className = 'chip';
  }
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.textContent = 'Run Verification';
  }

  const reqEl = document.getElementById('vs-api-request-json');
  const resEl = document.getElementById('vs-api-response-json');
  if (reqEl && sc) {
    reqEl.textContent = JSON.stringify({
      endpoint: "POST /v1/kyc/verify-merchant",
      merchant_id: "mch_" + sc.id,
      gstin: sc.gstin,
      pan: sc.pan,
      legal_entity: sc.gstName,
      bank_account_holder: sc.bankName,
      document_tampered: sc.docMetadata.tamperingDetected
    }, null, 2);
  }
  if (resEl) {
    resEl.textContent = "// Execute verification to inspect JSON response payload";
  }
}

async function runVerificationPipeline() {
  const runBtn = document.getElementById('vs-run-btn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = 'Evaluating...';
  }

  const checks = runVsValidation();
  const isTampered = document.getElementById('vs-tamper')?.value === 'tampered';

  let score = 0;
  if (checks.isGstinValid) score += 25;
  if (checks.isPanValid) score += 20;
  if (checks.isCrossMatch) score += 20;
  score += Math.round((checks.similarity / 100) * 25);
  if (!isTampered) score += 10;

  const scoreNum = document.getElementById('vs-score-num');
  const badge = document.getElementById('vs-decision-badge');
  if (scoreNum) scoreNum.textContent = score;

  let decision = 'AUTO_REJECT';
  let badgeClass = 'chip-bad';
  let badgeText = 'Auto-reject (<50)';

  if (score >= 85) {
    decision = 'AUTO_APPROVE';
    badgeClass = 'chip-ok';
    badgeText = 'Auto-approve (>=85)';
  } else if (score >= 50) {
    decision = 'MANUAL_REVIEW';
    badgeClass = 'chip-accent';
    badgeText = 'Manual review (50-84)';
  }

  if (badge) {
    badge.textContent = badgeText;
    badge.className = `chip ${badgeClass}`;
  }

  const resEl = document.getElementById('vs-api-response-json');
  if (resEl) {
    const payload = {
      verification_id: "vsh_" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      score: score,
      decision: decision,
      checks: {
        gstin_valid: checks.isGstinValid,
        pan_valid: checks.isPanValid,
        cross_match: checks.isCrossMatch,
        name_similarity_pct: checks.similarity,
        tampering_detected: isTampered
      },
      next_action: decision === 'AUTO_APPROVE' ? 'SETTLEMENT_ENABLED' : (decision === 'MANUAL_REVIEW' ? 'ROUTE_OPS_QUEUE' : 'BLOCK_MERCHANT')
    };
    resEl.textContent = JSON.stringify(payload, null, 2);
  }

  if (runBtn) {
    runBtn.disabled = false;
    runBtn.textContent = 'Run Verification';
  }

  if (window.showToast) {
    window.showToast(`Verification completed: Score ${score}/100 (${decision})`, decision === 'AUTO_APPROVE' ? 'success' : (decision === 'AUTO_REJECT' ? 'error' : 'info'));
  }
}

function approveMerchantManually() {
  const gstName = document.getElementById('vs-gst-name')?.value || 'Merchant';
  vsAuditLogs.unshift({
    time: new Date().toLocaleTimeString(),
    merchant: gstName,
    action: "OPERATOR_APPROVED",
    score: parseInt(document.getElementById('vs-score-num')?.textContent || '80', 10),
    actor: "Ops Lead (Manual Override)",
    status: "APPROVED"
  });
  renderVsAuditLogs();
  if (window.showToast) window.showToast(`Merchant approved by manual override`, 'success');
}

function routeToManualReview() {
  const gstName = document.getElementById('vs-gst-name')?.value || 'Merchant';
  vsAuditLogs.unshift({
    time: new Date().toLocaleTimeString(),
    merchant: gstName,
    action: "ESCALATED_TIER_2",
    score: parseInt(document.getElementById('vs-score-num')?.textContent || '65', 10),
    actor: "Compliance Officer",
    status: "IN_REVIEW"
  });
  renderVsAuditLogs();
  if (window.showToast) window.showToast(`Escalated to Tier-2 Review Queue`, 'info');
}

function rejectMerchantWebhook() {
  const gstName = document.getElementById('vs-gst-name')?.value || 'Merchant';
  vsAuditLogs.unshift({
    time: new Date().toLocaleTimeString(),
    merchant: gstName,
    action: "SYSTEM_REJECTED",
    score: parseInt(document.getElementById('vs-score-num')?.textContent || '24', 10),
    actor: "Risk Webhook Engine",
    status: "REJECTED"
  });
  renderVsAuditLogs();
  if (window.showToast) window.showToast(`Rejection webhook dispatched to merchant portal`, 'error');
}

function renderVsAuditLogs() {
  const tbody = document.getElementById('vs-audit-table');
  if (!tbody) return;

  tbody.innerHTML = vsAuditLogs.slice(0, 5).map(log => {
    const chipClass = log.status === 'APPROVED' ? 'chip-ok' : (log.status === 'REJECTED' ? 'chip-bad' : 'chip-accent');
    return `
      <tr class="border-b border-rule font-mono text-xs">
        <td class="py-2 text-muted">${log.time}</td>
        <td class="py-2 text-ink font-medium">${escapeHtml(log.merchant)}</td>
        <td class="py-2 text-ink-2">${log.action}</td>
        <td class="py-2 text-right">${log.score}</td>
        <td class="py-2 text-right"><span class="chip ${chipClass}">${log.status}</span></td>
      </tr>
    `;
  }).join('');
}

window.selectVsScenario = selectVsScenario;
window.runVerificationPipeline = runVerificationPipeline;
window.approveMerchantManually = approveMerchantManually;
window.routeToManualReview = routeToManualReview;
window.rejectMerchantWebhook = rejectMerchantWebhook;
