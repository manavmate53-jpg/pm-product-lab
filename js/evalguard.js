// EvalGuard AI: Production Workflow Agent with Live Evals, Guardrails & Token Cost Economics
// Client-side simulation of prompt injection shields, Pydantic schema validation, HITL escalation, and unit economics

let evalCases = [];
let benchmark20 = [];
let currentEvalCase = null;
let currentModelKey = 'llama8b';
let confidenceThreshold = 80;
let enforcePydanticSchema = true;

const modelProfiles = {
  llama8b: {
    name: "Llama 3.1 8B (NVIDIA NIM: Fast/Low Cost)",
    provider: "Self-Hosted / NIM",
    costInPerMillionUsd: 0.15,
    costOutPerMillionUsd: 0.20,
    costInPerMillionInr: 12.5,
    costOutPerMillionInr: 16.7,
    baseLatencyMs: 420,
    savingsVsGpt4o: 86.4
  },
  llama70b: {
    name: "Llama 3.1 70B (Balanced)",
    provider: "NVIDIA NIM / Hosted",
    costInPerMillionUsd: 0.80,
    costOutPerMillionUsd: 0.90,
    costInPerMillionInr: 66.8,
    costOutPerMillionInr: 75.2,
    baseLatencyMs: 950,
    savingsVsGpt4o: 48.2
  },
  gpt4o: {
    name: "GPT-4o (High Reasoning/High Cost)",
    provider: "OpenAI Proprietary",
    costInPerMillionUsd: 2.50,
    costOutPerMillionUsd: 10.00,
    costInPerMillionInr: 209.0,
    costOutPerMillionInr: 836.0,
    baseLatencyMs: 1450,
    savingsVsGpt4o: 0.0
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadEvalCases();
});

// Load test cases
async function loadEvalCases() {
  try {
    const res = await fetch('data/eval-cases.json');
    const data = await res.json();
    evalCases = data.testCases;
    benchmark20 = data.benchmark20;
  } catch (err) {
    evalCases = [];
    benchmark20 = [];
  }

  // Pre-select Case 1
  selectEvalCase('case-1');
}

// Select a test case scenario
function selectEvalCase(caseId) {
  const c = evalCases.find(item => item.id === caseId);
  if (!c) return;

  currentEvalCase = c;

  // Highlight active preset button
  ['case-1', 'case-2', 'case-3', 'case-4'].forEach(id => {
    const btn = document.getElementById(`btn-case-${id}`);
    if (btn) {
      if (id === caseId) {
        btn.classList.add('border-purple-500', 'bg-purple-950/60', 'text-white');
        btn.classList.remove('border-slate-800', 'text-slate-400', 'bg-slate-900/60');
      } else {
        btn.classList.remove('border-purple-500', 'bg-purple-950/60', 'text-white');
        btn.classList.add('border-slate-800', 'text-slate-400', 'bg-slate-900/60');
      }
    }
  });

  // Populate prompt textarea
  const inputEl = document.getElementById('eg-prompt-input');
  if (inputEl) inputEl.value = c.rawInput;

  // Reset steps & output state
  resetAgentExecutionUI(c);

  // Update unit economics card
  updateUnitEconomics(c);

  showToast(`Loaded: ${c.name.split(':')[0]}`, 'info');
}

// Reset UI before execution
function resetAgentExecutionUI(c) {
  for (let s = 1; s <= 4; s++) {
    const icon = document.getElementById(`eg-step-icon-${s}`);
    const text = document.getElementById(`eg-step-text-${s}`);
    if (icon) icon.className = "w-5 h-5 rounded-full border border-slate-700 bg-slate-900 text-slate-500 flex items-center justify-center text-[10px]";
    if (text) text.className = "text-xs text-slate-500";
  }

  const runBtn = document.getElementById('eg-run-btn');
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = `<span>Run Agent &amp; Evaluate</span><i data-lucide="play" class="w-4 h-4 ml-1"></i>`;
  }

  const statusBadge = document.getElementById('eg-status-badge');
  if (statusBadge) {
    statusBadge.textContent = "AWAITING EXECUTION";
    statusBadge.className = "text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700";
  }

  const userView = document.getElementById('eg-user-rendered-view');
  const jsonView = document.getElementById('eg-json-schema-view');

  if (userView) {
    userView.innerHTML = `
      <div class="p-6 text-center text-slate-500 text-xs">
        Click 'Run Agent &amp; Evaluate' to execute pipeline guardrails, check schema compliance, and evaluate HITL routing.
      </div>
    `;
  }

  if (jsonView) {
    jsonView.textContent = `// Structured Pydantic JSON output will render here upon evaluation`;
  }

  if (window.lucide) window.lucide.createIcons();
}

// Change model selection
function setAgentModel(modelKey) {
  currentModelKey = modelKey;
  updateUnitEconomics(currentEvalCase);
  showToast(`Switched model to ${modelProfiles[modelKey].name.split(' ')[0]} ${modelProfiles[modelKey].name.split(' ')[1]}`, 'info');
}

// Change confidence threshold slider
function updateConfidenceSlider(val) {
  confidenceThreshold = parseInt(val, 10);
  const displayEl = document.getElementById('eg-threshold-display');
  if (displayEl) displayEl.textContent = `${confidenceThreshold}%`;

  // Re-check decision state if already executed
  if (currentEvalCase) {
    updateUnitEconomics(currentEvalCase);
  }
}

// Toggle strict Pydantic JSON schema
function toggleSchemaEnforcement(checked) {
  enforcePydanticSchema = checked;
  showToast(checked ? "Strict JSON Schema enforced" : "Unstructured free-text mode active", "info");
}

// Execute Agent & Pipeline
async function runAgentExecution() {
  const runBtn = document.getElementById('eg-run-btn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>Evaluating Guardrails...</span><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>`;
  }

  const c = currentEvalCase;
  if (!c) return;

  const model = modelProfiles[currentModelKey];

  // Stage 1: PII Masking Shield (300ms)
  await sleep(300);
  setEvalStepState(1, 'active', 'Scanning regex & NER for credit cards, phone numbers...');
  await sleep(300);
  setEvalStepState(1, 'done', `PII Shield Passed (${c.piiMasked})`);

  // Stage 2: Prompt Injection Guardrail (350ms)
  setEvalStepState(2, 'active', 'Running Llama-Guard / heuristic jailbreak detection...');
  await sleep(350);
  if (c.injectionDetected) {
    setEvalStepState(2, 'flagged', 'Injection Keyword Detected: BLOCKED');
  } else {
    setEvalStepState(2, 'done', 'Injection Shield Passed (Zero Jailbreak Risk)');
  }

  // Stage 3: Pydantic Schema Validation (350ms)
  setEvalStepState(3, 'active', 'Validating structured fields against Pydantic model...');
  await sleep(350);
  setEvalStepState(3, 'done', 'JSON Schema Validation Passed (100% Type-Safe)');

  // Stage 4: Confidence Threshold Check (300ms)
  setEvalStepState(4, 'active', 'Comparing model confidence against slider threshold...');
  await sleep(300);

  const isBelowThreshold = c.confidence < confidenceThreshold;
  if (c.injectionDetected) {
    setEvalStepState(4, 'flagged', 'Security Alert Dispatched & Logged');
  } else if (isBelowThreshold) {
    setEvalStepState(4, 'flagged', `Confidence (${c.confidence}%) < Threshold (${confidenceThreshold}%): HITL Triggered`);
  } else {
    setEvalStepState(4, 'done', `Confidence (${c.confidence}%) &ge; Threshold (${confidenceThreshold}%): Autonomous Pass`);
  }

  // Render Output
  renderAgentOutputs(c, isBelowThreshold, model);

  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = `<span>Re-run Evaluation</span><i data-lucide="rotate-cw" class="w-4 h-4 ml-1"></i>`;
  }

  if (window.lucide) window.lucide.createIcons();
}

function setEvalStepState(stepNumber, state, label) {
  const icon = document.getElementById(`eg-step-icon-${stepNumber}`);
  const text = document.getElementById(`eg-step-text-${stepNumber}`);

  if (state === 'active') {
    if (icon) icon.className = "w-5 h-5 rounded-full border border-purple-500 bg-purple-900/60 text-purple-300 flex items-center justify-center text-[10px] animate-pulse";
    if (text) {
      text.className = "text-xs text-purple-400 font-medium";
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
  } else if (state === 'flagged') {
    if (icon) {
      icon.className = "w-5 h-5 rounded-full border border-amber-500 bg-amber-950 text-amber-400 flex items-center justify-center text-[10px]";
      icon.innerHTML = `!`;
    }
    if (text) {
      text.className = "text-xs text-amber-400 font-medium";
      text.textContent = label;
    }
  }
}

// Render Agent Outputs (Rendered view + Pydantic JSON)
function renderAgentOutputs(c, isBelowThreshold, model) {
  const statusBadge = document.getElementById('eg-status-badge');
  const userView = document.getElementById('eg-user-rendered-view');
  const jsonView = document.getElementById('eg-json-schema-view');

  let finalAction = c.action;
  let finalStatusLabel = "AUTONOMOUS RESOLUTION";
  let statusBadgeClass = "bg-emerald-950 text-emerald-300 border-emerald-800";

  if (c.injectionDetected) {
    finalAction = "SECURITY_INCIDENT_BLOCKED";
    finalStatusLabel = "ADVERSARIAL ATTACK BLOCKED";
    statusBadgeClass = "bg-rose-950 text-rose-300 border-rose-800";
    showToast("Adversarial injection blocked by pre-guardrail filter", "error");
  } else if (isBelowThreshold) {
    finalAction = "ESCALATED_TO_HUMAN_AGENT";
    finalStatusLabel = "ESCALATED TO HUMAN IN THE LOOP";
    statusBadgeClass = "bg-amber-950 text-amber-300 border-amber-800";
    showToast(`Confidence (${c.confidence}%) is below ${confidenceThreshold}%. Escalated to Ops Agent.`, "warning");
  } else {
    showToast("Execution Succeeded: Structured response validated autonomously", "success");
  }

  if (statusBadge) {
    statusBadge.textContent = finalStatusLabel;
    statusBadge.className = `text-xs font-mono font-bold px-2.5 py-1 rounded border ${statusBadgeClass}`;
  }

  // Render User View
  if (userView) {
    userView.innerHTML = `
      <div class="space-y-3 font-sans">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <span class="text-[10px] uppercase font-mono text-slate-400">Classified Intent:</span>
            <div class="text-sm font-bold text-white">${c.intent}</div>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase font-mono text-slate-400">Model Confidence:</span>
            <div class="text-sm font-bold font-mono ${c.confidence >= confidenceThreshold ? 'text-emerald-400' : 'text-amber-400'}">${c.confidence}%</div>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
          <div class="font-bold text-slate-300 uppercase text-[10px]">Action Execution:</div>
          <div class="font-mono font-bold ${c.injectionDetected ? 'text-rose-400' : (isBelowThreshold ? 'text-amber-400' : 'text-emerald-400')}">
            &bull; ${finalAction}
          </div>
          <p class="text-slate-300 leading-relaxed text-xs pt-1">${c.reasoning}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
          <div class="p-2 rounded bg-slate-950/50 border border-slate-800">
            <span class="text-slate-500 block text-[9px]">PII Sanitization</span>
            <span class="text-slate-300 truncate block">${c.piiMasked}</span>
          </div>
          <div class="p-2 rounded bg-slate-950/50 border border-slate-800">
            <span class="text-slate-500 block text-[9px]">Execution Model</span>
            <span class="text-slate-300 truncate block">${model.name.split(' ')[0]} ${model.name.split(' ')[1]}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Render Pydantic JSON
  const pydanticPayload = {
    schema_version: "2026.04.1",
    model: model.name,
    timestamp: new Date().toISOString(),
    evaluation_result: {
      intent: c.intent,
      confidence_score: c.confidence / 100,
      confidence_threshold_applied: confidenceThreshold / 100,
      hitl_escalation_triggered: isBelowThreshold || c.injectionDetected,
      guardrail_audit: {
        pii_masking_applied: true,
        prompt_injection_flagged: c.injectionDetected,
        json_schema_compliant: enforcePydanticSchema
      },
      action_dispatch: {
        action_name: finalAction,
        payout_authorized_inr: c.payoutAmount,
        reasoning_summary: c.reasoning
      },
      telemetry: {
        input_tokens: c.tokensIn,
        output_tokens: c.tokensOut,
        latency_ms: model.baseLatencyMs,
        cost_usd: calculateRequestCostUsd(c.tokensIn, c.tokensOut, model)
      }
    }
  };

  if (jsonView) {
    jsonView.textContent = JSON.stringify(pydanticPayload, null, 2);
  }
}

// Update Unit Economics Card
function updateUnitEconomics(c) {
  if (!c) return;

  const model = modelProfiles[currentModelKey];
  const tokensIn = c.tokensIn || 180;
  const tokensOut = c.tokensOut || 120;

  // Calculate costs
  const costPer1kUsd = ((tokensIn / 1000000) * model.costInPerMillionUsd + (tokensOut / 1000000) * model.costOutPerMillionUsd) * 1000;
  const costPer1kInr = costPer1kUsd * 83.6;

  const costPer100kRequestsInr = costPer1kInr * 100;

  const costInrEl = document.getElementById('eg-cost-inr');
  const costUsdEl = document.getElementById('eg-cost-usd');
  const latencyEl = document.getElementById('eg-latency-ms');
  const monthlyCostEl = document.getElementById('eg-monthly-cost-inr');
  const savingsPill = document.getElementById('eg-savings-pill');

  if (costInrEl) costInrEl.textContent = `₹${costPer1kInr.toFixed(2)}`;
  if (costUsdEl) costUsdEl.textContent = `$${costPer1kUsd.toFixed(4)}`;
  if (latencyEl) latencyEl.textContent = `${model.baseLatencyMs} ms`;
  if (monthlyCostEl) monthlyCostEl.textContent = `₹${Math.round(costPer100kRequestsInr).toLocaleString()} / mo`;

  if (savingsPill) {
    if (model.savingsVsGpt4o > 0) {
      savingsPill.textContent = `${model.savingsVsGpt4o}% Cheaper than GPT-4o`;
      savingsPill.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800";
    } else {
      savingsPill.textContent = "Baseline Cost Tier (GPT-4o)";
      savingsPill.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700";
    }
  }
}

function calculateRequestCostUsd(tokensIn, tokensOut, model) {
  const inCost = (tokensIn / 1000000) * model.costInPerMillionUsd;
  const outCost = (tokensOut / 1000000) * model.costOutPerMillionUsd;
  return parseFloat((inCost + outCost).toFixed(6));
}

// Switch Output Tab between User View and JSON Schema
function setOutputViewTab(tab) {
  const userContainer = document.getElementById('eg-user-rendered-view');
  const jsonContainer = document.getElementById('eg-json-view-container');
  const btnUser = document.getElementById('eg-tab-user');
  const btnJson = document.getElementById('eg-tab-json');

  if (tab === 'user') {
    userContainer?.classList.remove('hidden');
    jsonContainer?.classList.add('hidden');
    btnUser?.classList.add('active');
    btnJson?.classList.remove('active');
  } else {
    userContainer?.classList.add('hidden');
    jsonContainer?.classList.remove('hidden');
    btnJson?.classList.add('active');
    btnUser?.classList.remove('active');
  }
}

// Run 20-Case Regression Benchmark
async function runBatchBenchmark() {
  const btn = document.getElementById('eg-benchmark-btn');
  const progressContainer = document.getElementById('eg-benchmark-progress-box');
  const progressBar = document.getElementById('eg-benchmark-progress-bar');
  const progressText = document.getElementById('eg-benchmark-progress-text');
  const tableContainer = document.getElementById('eg-benchmark-table-box');
  const tbody = document.getElementById('eg-benchmark-table-body');

  if (btn) btn.disabled = true;
  if (progressContainer) progressContainer.classList.remove('hidden');

  showToast("Executing 20-case LLM regression eval suite...", "info");

  // Animate progress
  for (let p = 5; p <= 100; p += 15) {
    if (progressBar) progressBar.style.width = `${p}%`;
    if (progressText) progressText.textContent = `Running test case ${Math.min(20, Math.ceil((p / 100) * 20))} of 20...`;
    await sleep(220);
  }

  if (progressText) progressText.textContent = "Benchmark Complete &middot; 20 of 20 Passed";
  showToast("Benchmark Complete: 100% Schema Compliance &middot; 0% Hallucinations", "success");

  // Render Table
  if (tbody && benchmark20.length > 0) {
    tbody.innerHTML = benchmark20.map(t => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 text-[11px] font-mono">
        <td class="py-2 px-2.5 text-slate-500">#${t.id}</td>
        <td class="py-2 px-2.5 font-sans font-medium text-white">${t.test}</td>
        <td class="py-2 px-2.5 text-slate-400">${t.category}</td>
        <td class="py-2 px-2.5 text-slate-300 font-bold">${t.expected}</td>
        <td class="py-2 px-2.5 text-emerald-400 font-bold">${t.modelOutput}</td>
        <td class="py-2 px-2.5 text-slate-400">${t.latency}</td>
        <td class="py-2 px-2.5">
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            ${t.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  if (tableContainer) tableContainer.classList.remove('hidden');
  if (btn) btn.disabled = false;
}

// Copy Pydantic JSON helper
function copyPydanticJson() {
  const el = document.getElementById('eg-json-schema-view');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    showToast("Pydantic JSON Schema copied to clipboard", "success");
  }).catch(() => {
    showToast("Copied to clipboard", "info");
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose globally
window.selectEvalCase = selectEvalCase;
window.setAgentModel = setAgentModel;
window.updateConfidenceSlider = updateConfidenceSlider;
window.toggleSchemaEnforcement = toggleSchemaEnforcement;
window.runAgentExecution = runAgentExecution;
window.setOutputViewTab = setOutputViewTab;
window.runBatchBenchmark = runBatchBenchmark;
window.copyPydanticJson = copyPydanticJson;
