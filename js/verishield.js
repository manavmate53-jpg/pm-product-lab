// VeriShield: B2B Merchant KYC & Document Risk Engine
// Client-side deterministic validation, OCR simulation, Levenshtein matching & Ops Audit Trail

let currentScenario = null;
let scenariosData = [];
let auditLogs = [
  {
    timestamp: "10:14:22",
    merchant: "Apex Industrial Logistics",
    action: "SYSTEM_AUTO_APPROVED",
    score: 96,
    actor: "VeriShield Rules Engine v2.4",
    status: "APPROVED",
    hash: "0x7a8f...4b12"
  },
  {
    timestamp: "09:42:05",
    merchant: "Falcon Global Tech",
    action: "ROUTED_MANUAL_QUEUE",
    score: 72,
    actor: "Risk Engine Threshold",
    status: "IN_REVIEW",
    hash: "0x3e11...99bc"
  }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadScenarios();
  setupRealtimeListeners();
  renderAuditLogs();
});

// Load Scenarios from JSON or fallback
async function loadScenarios() {
  try {
    const res = await fetch('data/kyc-samples.json');
    const data = await res.json();
    scenariosData = data.scenarios;
  } catch (err) {
    // Deterministic fallback
    scenariosData = [
      {
        id: "scenario-a",
        name: "Scenario A: Clean Enterprise Merchant (Auto-Approve)",
        badge: "Auto-Approve (>85 Score)",
        badgeClass: "text-emerald-400 bg-emerald-950/80 border-emerald-800",
        gstin: "27AABCU9603R1ZM",
        pan: "AABCU9603R",
        gstName: "Apex Industrial Logistics Pvt Ltd",
        bankName: "Apex Industrial Logistics Pvt Ltd",
        state: "Maharashtra (27)",
        annualTurnover: "₹4.85 Cr",
        docMetadata: {
          producer: "Adobe Acrobat Pro (Clean)",
          digitalSignature: "Valid Class 3 DSC",
          tamperingDetected: false
        },
        expectedScore: 96,
        decision: "AUTO_APPROVE",
        summary: "Full cryptographic checksum match, exact entity string equivalence, and valid Class 3 digital signature."
      },
      {
        id: "scenario-b",
        name: "Scenario B: Fuzzy Name Mismatch (Manual Review)",
        badge: "Manual Review (60-85 Score)",
        badgeClass: "text-amber-400 bg-amber-950/80 border-amber-800",
        gstin: "27AAFCN1234F1Z5",
        pan: "AAFCN1234F",
        gstName: "Neo Manpower Services",
        bankName: "NeoManpower Ops LLP",
        state: "Maharashtra (27)",
        annualTurnover: "₹1.42 Cr",
        docMetadata: {
          producer: "HP ScanJet Direct",
          digitalSignature: "Not present (Physical Scan)",
          tamperingDetected: false
        },
        expectedScore: 74,
        decision: "MANUAL_REVIEW",
        summary: "Valid GSTIN/PAN cross-match, but entity name on GST differs from Bank statement. Routed to ops team for 1-click override."
      },
      {
        id: "scenario-c",
        name: "Scenario C: High-Risk / Tampered Document (Auto-Reject)",
        badge: "Auto-Reject (<60 Score)",
        badgeClass: "text-rose-400 bg-rose-950/80 border-rose-800",
        gstin: "27AABCU9999R9X0",
        pan: "BXYPA1234K",
        gstName: "Global Shadow Enterprises",
        bankName: "Quick Payouts Corp",
        state: "Maharashtra (27)",
        annualTurnover: "Unverified",
        docMetadata: {
          producer: "PDF-XChange Editor v7.0 (Modified)",
          digitalSignature: "Invalid or Tampered Hash",
          tamperingDetected: true
        },
        expectedScore: 28,
        decision: "AUTO_REJECT",
        summary: "GSTIN internal PAN does not match submitted PAN. PDF metadata reveals modified creation dates and missing checksum."
      }
    ];
  }

  // Pre-select Scenario A as default
  selectScenario('scenario-a');
}

// Select Scenario
function selectScenario(scenarioId) {
  const scenario = scenariosData.find(s => s.id === scenarioId);
  if (!scenario) return;

  currentScenario = scenario;

  // Highlight active preset button
  ['scenario-a', 'scenario-b', 'scenario-c'].forEach(id => {
    const btn = document.getElementById(`btn-${id}`);
    if (btn) {
      if (id === scenarioId) {
        btn.classList.add('border-blue-500', 'bg-blue-950/60', 'text-white');
        btn.classList.remove('border-slate-800', 'text-slate-400', 'bg-slate-900/60');
      } else {
        btn.classList.remove('border-blue-500', 'bg-blue-950/60', 'text-white');
        btn.classList.add('border-slate-800', 'text-slate-400', 'bg-slate-900/60');
      }
    }
  });

  // Populate inputs
  const gstinInput = document.getElementById('vs-gstin');
  const panInput = document.getElementById('vs-pan');
  const gstNameInput = document.getElementById('vs-gst-name');
  const bankNameInput = document.getElementById('vs-bank-name');
  const metaBadge = document.getElementById('vs-metadata-badge');

  if (gstinInput) gstinInput.value = scenario.gstin;
  if (panInput) panInput.value = scenario.pan;
  if (gstNameInput) gstNameInput.value = scenario.gstName;
  if (bankNameInput) bankNameInput.value = scenario.bankName;

  if (metaBadge) {
    if (scenario.docMetadata.tamperingDetected) {
      metaBadge.textContent = "Tampering Anomaly Flagged (PDF-XChange Mod)";
      metaBadge.className = "text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800";
    } else {
      metaBadge.textContent = `${scenario.docMetadata.digitalSignature} &middot; Producer: ${scenario.docMetadata.producer}`;
      metaBadge.className = "text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800";
    }
  }

  // Update live validation pills immediately
  runLiveValidation();

  // Reset pipeline & results view to prompt user to run
  resetPipelineUI(scenario);

  showToast(`Loaded: ${scenario.name.split(':')[0]}`, 'info');
}

// Setup real-time input listeners
function setupRealtimeListeners() {
  ['vs-gstin', 'vs-pan', 'vs-gst-name', 'vs-bank-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', runLiveValidation);
    }
  });
}

// Validation Regex & Checks
function runLiveValidation() {
  const gstin = (document.getElementById('vs-gstin')?.value || '').trim().toUpperCase();
  const pan = (document.getElementById('vs-pan')?.value || '').trim().toUpperCase();
  const gstName = (document.getElementById('vs-gst-name')?.value || '').trim();
  const bankName = (document.getElementById('vs-bank-name')?.value || '').trim();

  // 1. GSTIN Regex
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isGstinValid = gstinRegex.test(gstin);

  // 2. PAN Regex
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanValid = panRegex.test(pan);

  // 3. PAN embedded in GSTIN
  let isCrossMatch = false;
  if (gstin.length >= 12 && pan.length === 10) {
    const embeddedPan = gstin.substring(2, 12);
    isCrossMatch = (embeddedPan === pan);
  }

  // 4. Fuzzy Similarity
  const similarity = calculateLevenshteinSimilarity(gstName, bankName);

  // Update Pills
  updatePill('pill-gstin-status', isGstinValid ? 'VALID 15-CHAR GSTIN' : 'INVALID GSTIN FORMAT', isGstinValid ? 'valid' : 'invalid');
  updatePill('pill-pan-status', isPanValid ? 'VALID 10-CHAR PAN' : 'INVALID PAN FORMAT', isPanValid ? 'valid' : 'invalid');
  updatePill('pill-cross-match', isCrossMatch ? 'PAN-GSTIN MATCH' : 'PAN DISCREPANCY', isCrossMatch ? 'valid' : 'invalid');
  
  let simType = 'invalid';
  if (similarity >= 90) simType = 'valid';
  else if (similarity >= 65) simType = 'warning';
  updatePill('pill-similarity', `${similarity}% ENTITY MATCH`, simType);

  return { isGstinValid, isPanValid, isCrossMatch, similarity, gstin, pan, gstName, bankName };
}

function updatePill(id, text, status) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = text;
  if (status === 'valid') {
    el.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800";
  } else if (status === 'warning') {
    el.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800";
  } else {
    el.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800";
  }
}

// Levenshtein Distance Calculation & String Similarity
function calculateLevenshteinSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  
  // Normalize strings
  const clean1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean1 === clean2) return 100;
  if (clean1.length === 0 || clean2.length === 0) return 0;

  const track = Array(clean2.length + 1).fill(null).map(() =>
    Array(clean1.length + 1).fill(null));

  for (let i = 0; i <= clean1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= clean2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= clean2.length; j += 1) {
    for (let i = 1; i <= clean1.length; i += 1) {
      const indicator = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[clean2.length][clean1.length];
  const maxLen = Math.max(clean1.length, clean2.length);
  const similarityRatio = (maxLen - distance) / maxLen;
  return Math.round(similarityRatio * 100);
}

// Reset UI before run
function resetPipelineUI(scenario) {
  const steps = [1, 2, 3, 4];
  steps.forEach(s => {
    const icon = document.getElementById(`vs-step-icon-${s}`);
    const text = document.getElementById(`vs-step-text-${s}`);
    if (icon) icon.className = "w-5 h-5 rounded-full border border-slate-700 bg-slate-900 text-slate-500 flex items-center justify-center text-[10px]";
    if (text) text.className = "text-xs text-slate-500";
  });

  const gauge = document.getElementById('vs-score-gauge');
  const scoreNum = document.getElementById('vs-score-num');
  const decisionBadge = document.getElementById('vs-decision-badge');
  const runBtn = document.getElementById('vs-run-btn');

  if (gauge) gauge.style.width = '0%';
  if (scoreNum) scoreNum.textContent = '--';
  if (decisionBadge) {
    decisionBadge.textContent = "AWAITING RUN";
    decisionBadge.className = "text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700";
  }
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = `<span>Run Verification Pipeline</span><i data-lucide="play" class="w-4 h-4 ml-1"></i>`;
  }

  const reqViewer = document.getElementById('vs-api-request-json');
  const resViewer = document.getElementById('vs-api-response-json');
  if (reqViewer && scenario) {
    reqViewer.textContent = JSON.stringify({
      endpoint: "POST /v1/kyc/verify-merchant",
      headers: {
        "Authorization": "Bearer vsh_live_sec_99381",
        "Content-Type": "application/json"
      },
      body: {
        merchant_reference_id: "mch_" + scenario.id,
        submitted_documents: {
          gst_certificate: {
            gstin: scenario.gstin,
            legal_entity_name: scenario.gstName,
            state_code: scenario.gstin.substring(0, 2)
          },
          bank_statement: {
            account_holder_name: scenario.bankName,
            extracted_pan: scenario.pan
          }
        }
      }
    }, null, 2);
  }
  if (resViewer) {
    resViewer.textContent = `// Click 'Run Verification Pipeline' to execute live API handshake and compute confidence score`;
  }

  if (window.lucide) window.lucide.createIcons();
}

// Execute 4-Stage Verification Pipeline
async function runVerificationPipeline() {
  const runBtn = document.getElementById('vs-run-btn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>Executing Pipeline...</span><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>`;
  }

  showToast("Initiating 4-stage compliance verification...", "info");

  // Current checks
  const checks = runLiveValidation();
  const isTampered = currentScenario?.docMetadata?.tamperingDetected || false;

  // Stage 1: Document OCR Extraction (300ms)
  await sleep(350);
  setStepState(1, 'active', 'Extracting bounding box entities from PDF...');
  await sleep(350);
  setStepState(1, 'done', 'OCR Complete (Confidence: 99.2%)');

  // Stage 2: CKYC & GSTN Registry Handshake (400ms)
  setStepState(2, 'active', 'Querying GSTN portal & Central KYC Registry...');
  await sleep(450);
  setStepState(2, 'done', checks.isGstinValid ? 'GSTN Active & Verified (State: 27 MH)' : 'GSTN Lookup: Invalid Format Checksum');

  // Stage 3: Fuzzy Entity Matching (350ms)
  setStepState(3, 'active', `Computing Levenshtein distance on '${checks.gstName}'...`);
  await sleep(400);
  setStepState(3, 'done', `Entity Similarity: ${checks.similarity}%`);

  // Stage 4: Risk Scoring & Decision Routing (350ms)
  setStepState(4, 'active', 'Aggregating rule matrix into confidence score...');
  await sleep(400);

  // Compute final score
  let score = 0;
  if (checks.isGstinValid) score += 20;
  if (checks.isPanValid) score += 20;
  if (checks.isCrossMatch) score += 30;
  else score = Math.max(0, score - 20); // Penalty for mismatch

  // Levenshtein contribution (max 20)
  score += Math.round((checks.similarity / 100) * 20);

  // Metadata check (max 10)
  if (!isTampered) score += 10;
  else score = Math.max(15, score - 40);

  score = Math.min(100, Math.max(0, score));

  setStepState(4, 'done', `Risk Engine Finalized: ${score}/100`);

  // Animate Gauge & Decision
  renderScoreAndDecision(score, checks);

  // Generate & render live JSON payload
  renderApiPayloads(score, checks, isTampered);

  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = `<span>Re-run Verification</span><i data-lucide="rotate-cw" class="w-4 h-4 ml-1"></i>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

function setStepState(stepNumber, state, label) {
  const icon = document.getElementById(`vs-step-icon-${stepNumber}`);
  const text = document.getElementById(`vs-step-text-${stepNumber}`);

  if (state === 'active') {
    if (icon) icon.className = "w-5 h-5 rounded-full border border-blue-500 bg-blue-900/60 text-blue-300 flex items-center justify-center text-[10px] animate-pulse";
    if (text) {
      text.className = "text-xs text-blue-400 font-medium";
      text.textContent = label;
    }
  } else if (state === 'done') {
    if (icon) {
      icon.className = "w-5 h-5 rounded-full border border-emerald-500 bg-emerald-950 text-emerald-400 flex items-center justify-center text-[10px]";
      icon.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
    }
    if (text) {
      text.className = "text-xs text-slate-300";
      text.textContent = label;
    }
  }
}

function renderScoreAndDecision(score, checks) {
  const gauge = document.getElementById('vs-score-gauge');
  const scoreNum = document.getElementById('vs-score-num');
  const decisionBadge = document.getElementById('vs-decision-badge');
  const summaryBox = document.getElementById('vs-decision-summary');

  if (gauge) {
    gauge.style.width = `${score}%`;
    if (score >= 85) gauge.className = "h-full bg-emerald-500 transition-all duration-700 rounded-full";
    else if (score >= 60) gauge.className = "h-full bg-amber-500 transition-all duration-700 rounded-full";
    else gauge.className = "h-full bg-rose-500 transition-all duration-700 rounded-full";
  }

  if (scoreNum) scoreNum.textContent = score;

  if (decisionBadge) {
    if (score >= 85) {
      decisionBadge.textContent = "AUTO_APPROVE (STP HANDSHAKE)";
      decisionBadge.className = "text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800";
      if (summaryBox) summaryBox.textContent = "High confidence pass (>85). Straight-Through Processing (STP) triggered with 0 manual intervention.";
      showToast("Verification Passed: Auto-Approved via STP Handshake", "success");
    } else if (score >= 60) {
      decisionBadge.textContent = "ROUTED_TO_MANUAL_QUEUE";
      decisionBadge.className = "text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800";
      if (summaryBox) summaryBox.textContent = `Fuzzy name match score (${checks.similarity}%) falls in human review window [60-85]. Flagged for 1-click ops review.`;
      showToast("Fuzzy Match: Routed to Ops Review Queue", "warning");
    } else {
      decisionBadge.textContent = "AUTO_REJECT (HIGH RISK)";
      decisionBadge.className = "text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800";
      if (summaryBox) summaryBox.textContent = "Risk score below threshold (<60). Checksum or PAN discrepancy anomaly detected. Automated rejection webhook scheduled.";
      showToast("Security Alert: High-risk anomaly detected", "error");
    }
  }

  // Update table breakdown scores
  updateRuleBreakdown(checks, score);
}

function updateRuleBreakdown(checks, score) {
  const rFormat = document.getElementById('rule-format-score');
  const rCross = document.getElementById('rule-cross-score');
  const rFuzzy = document.getElementById('rule-fuzzy-score');
  const rMeta = document.getElementById('rule-meta-score');

  if (rFormat) rFormat.textContent = checks.isGstinValid && checks.isPanValid ? "20 / 20 pts" : "0 / 20 pts";
  if (rCross) rCross.textContent = checks.isCrossMatch ? "30 / 30 pts" : "0 / 30 pts (Mismatch)";
  if (rFuzzy) rFuzzy.textContent = `${Math.round((checks.similarity / 100) * 20)} / 20 pts (${checks.similarity}%)`;
  if (rMeta) {
    const isTampered = currentScenario?.docMetadata?.tamperingDetected || false;
    rMeta.textContent = !isTampered ? "20 / 20 pts" : "0 / 20 pts (Tampered)";
  }
}

// Generate & render API Request/Response JSON
function renderApiPayloads(score, checks, isTampered) {
  const reqViewer = document.getElementById('vs-api-request-json');
  const resViewer = document.getElementById('vs-api-response-json');

  const requestId = "req_" + Math.random().toString(36).substring(2, 10);
  const traceId = "trc_" + Math.random().toString(36).substring(2, 12);
  const timestamp = new Date().toISOString();

  const requestPayload = {
    endpoint: "POST /v1/kyc/verify-merchant",
    headers: {
      "Authorization": "Bearer vsh_live_sec_99381",
      "Content-Type": "application/json",
      "X-Idempotency-Key": requestId
    },
    body: {
      merchant_reference_id: "mch_mum_8819",
      submitted_documents: {
        gst_certificate: {
          gstin: checks.gstin,
          legal_entity_name: checks.gstName,
          state_code: checks.gstin.substring(0, 2) || "27"
        },
        bank_statement: {
          account_holder_name: checks.bankName,
          extracted_pan: checks.pan
        }
      },
      routing_preferences: {
        auto_approve_threshold: 85,
        manual_review_threshold: 60
      }
    }
  };

  const responsePayload = {
    status: 200,
    timestamp: timestamp,
    data: {
      verification_id: "vrf_" + Math.random().toString(36).substring(2, 10),
      request_id: requestId,
      audit_trace_id: traceId,
      decision: score >= 85 ? "AUTO_APPROVE" : (score >= 60 ? "MANUAL_REVIEW" : "AUTO_REJECT"),
      confidence_score: score,
      straight_through_processing: score >= 85,
      breakdown: {
        format_validations: {
          gstin_format_valid: checks.isGstinValid,
          pan_format_valid: checks.isPanValid
        },
        cross_field_match: {
          pan_in_gstin_matched: checks.isCrossMatch,
          embedded_pan: checks.gstin.substring(2, 12)
        },
        fuzzy_entity_matching: {
          algorithm: "Levenshtein_Distance_v2",
          similarity_score: checks.similarity,
          accepted_tolerance: checks.similarity >= 65
        },
        document_forensics: {
          tampering_detected: isTampered,
          producer: currentScenario?.docMetadata?.producer || "Clean"
        }
      },
      turnaround_time_ms: 420
    }
  };

  if (reqViewer) reqViewer.textContent = JSON.stringify(requestPayload, null, 2);
  if (resViewer) resViewer.textContent = JSON.stringify(responsePayload, null, 2);
}

// Copy JSON helper
function copyPayload(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast("API Payload copied to clipboard", "success");
  }).catch(() => {
    showToast("Copied to clipboard", "info");
  });
}

// Ops Action Buttons
function handleOpsAction(actionType) {
  const gstin = (document.getElementById('vs-gstin')?.value || '').trim();
  const gstName = (document.getElementById('vs-gst-name')?.value || '').trim();
  const score = parseInt(document.getElementById('vs-score-num')?.textContent || '0', 10);
  
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const hash = "0x" + Math.random().toString(36).substring(2, 6) + "..." + Math.random().toString(36).substring(2, 6);

  let actionText = "";
  let statusText = "";
  let actor = "Ops Lead (Manav M.)";

  if (actionType === 'approve') {
    actionText = "MANUAL_OVERRIDE_APPROVED";
    statusText = "APPROVED";
    showToast(`Merchant '${gstName}' approved manually. Webhook fired.`, "success");
  } else if (actionType === 'review') {
    actionText = "ASSIGNED_TO_TIER2_AUDIT";
    statusText = "IN_REVIEW";
    showToast(`Merchant '${gstName}' queued for secondary document request.`, "warning");
  } else if (actionType === 'reject') {
    actionText = "SECURITY_FRAUD_REJECTED";
    statusText = "REJECTED";
    showToast(`Merchant '${gstName}' rejected. Webhook dispatched to billing.`, "error");
  }

  // Prepend to audit log
  auditLogs.unshift({
    timestamp: timeStr,
    merchant: gstName || "Unnamed Merchant",
    action: actionText,
    score: isNaN(score) ? 50 : score,
    actor: actor,
    status: statusText,
    hash: hash
  });

  renderAuditLogs();
}

// Render Audit Logs Table
function renderAuditLogs() {
  const tbody = document.getElementById('vs-audit-table-body');
  if (!tbody) return;

  tbody.innerHTML = auditLogs.slice(0, 5).map(log => {
    let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";
    if (log.status === 'APPROVED') badgeClass = "bg-emerald-950 text-emerald-300 border-emerald-800";
    else if (log.status === 'IN_REVIEW') badgeClass = "bg-amber-950 text-amber-300 border-amber-800";
    else if (log.status === 'REJECTED') badgeClass = "bg-rose-950 text-rose-300 border-rose-800";

    return `
      <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 text-xs font-mono">
        <td class="py-2.5 px-3 text-slate-400">${log.timestamp}</td>
        <td class="py-2.5 px-3 font-sans font-medium text-white">${log.merchant}</td>
        <td class="py-2.5 px-3 text-slate-300">${log.action}</td>
        <td class="py-2.5 px-3 font-bold">${log.score}/100</td>
        <td class="py-2.5 px-3">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
            ${log.status}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-400 font-sans">${log.actor}</td>
        <td class="py-2.5 px-3 text-slate-500">${log.hash}</td>
      </tr>
    `;
  }).join('');
}

// Helper sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose globally
window.selectScenario = selectScenario;
window.runVerificationPipeline = runVerificationPipeline;
window.copyPayload = copyPayload;
window.handleOpsAction = handleOpsAction;
window.runLiveValidation = runLiveValidation;
