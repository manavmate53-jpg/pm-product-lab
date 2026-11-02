// Comprehensive PM Specifications & Technical PRD contracts for all 6 products
window.ProductSpecs = {
  verishield: {
    title: "VeriShield: B2B KYC & Document Risk Engine",
    category: "Fintech & Risk Operations",
    targetCompanies: "HSBC, IDfy, Razorpay, Signzy, Equifax",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "Enterprise onboarding in Indian B2B fintech suffers from high dropout rates during manual document verification. Small businesses and enterprise merchants encounter 24 to 48 hour turnaround delays while risk teams manually cross-reference Ministry of Corporate Affairs records, GST filings, and bank account proofs. High-volume operations face human fatigue, inconsistent fraud detection, and slow manual reviews."
      },
      {
        heading: "2. Solution Architecture",
        body: "VeriShield provides a deterministic, multi-stage client and edge verification engine. Stage 1 validates GSTIN and PAN format strings and state-code headers via regex. Stage 2 executes exact character matching between characters 3 to 12 of the GSTIN and the applicant's PAN. Stage 3 performs Levenshtein distance string similarity between the registered legal entity name and the bank account holder name. Stage 4 inspects document metadata for tampered PDF producers and digital signatures. Merchants scoring 85 or higher qualify for automated approval; scores between 50 and 84 route to manual review; scores below 50 trigger automatic rejection."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "Key metrics include reducing merchant onboarding turnaround time from 36 hours to under 30 seconds for clean applications, maintaining an automated pass rate of 72% or higher across enterprise cohorts, achieving zero false approvals on fraudulent or revoked tax entities, and capping manual review escalation volume at 20% of total daily registrations."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/kyc/verify-merchant
Headers:
  Authorization: Bearer <api_token>
  Content-Type: application/json
Request Body:
{
  "gstin": "27AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "legal_name": "Apex Industrial Logistics Pvt Ltd",
  "bank_account_name": "Apex Industrial Logistics Pvt Ltd",
  "state_code": "27",
  "document_tamper_flag": false
}
Response (200 OK):
{
  "verification_id": "vsh_981245",
  "status": "APPROVED",
  "risk_score": 96,
  "checks": {
    "gstin_format_valid": true,
    "pan_gstin_matched": true,
    "name_similarity_ratio": 1.0,
    "document_tampering_detected": false
  },
  "decision": "AUTO_APPROVE",
  "routing": "DIRECT_SETTLEMENT_ENABLED"
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "Manual verification currently costs approximately ₹180 per merchant application across outsourced Tier 1 review teams. By auto-approving 72% of standard applicants, VeriShield lowers verification unit cost to ₹38 per merchant, saving ₹1.42 Lakh per 1,000 onboarded businesses while reducing churn during document submission."
      }
    ]
  },
  automatch: {
    title: "AutoMatch: Marketplace Matching & Funnel Telemetry",
    category: "Marketplace & Conversion Optimization",
    targetCompanies: "Cars24, Spinny, CarDekho, CarTrade",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "Pre-owned vehicle marketplaces struggle with discovery fatigue. Buyers face 30+ granular filter dropdowns, resulting in a 44% bounce rate on search results pages. Traditional search forces non-technical consumers to specify engine displacements, transmission variants, and chassis parameters rather than addressing practical consumer requirements such as monthly budget, city commute habits, and 3-year maintenance expectations."
      },
      {
        heading: "2. Solution Architecture",
        body: "AutoMatch implements an experimentation framework comparing a legacy 30-filter search against a smart 3-step recommendation quiz. The scoring engine evaluates inventory records across multi-factor dimensions: budget proximity, transmission preference, annual fuel efficiency, certified inspection score, and 3-year Total Cost of Ownership (TCO). Telemetry events track user progression through each funnel stage."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "Primary goal is lifting discovery-to-inquiry conversion from 3.2% to 5.4% (a 68% relative increase). Secondary guardrails require zero inventory starvation on common search filters and maintaining client-side recommendation latency under 50 milliseconds."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/marketplace/match
Headers:
  Content-Type: application/json
Request Body:
{
  "budget_max_lakh": 15.0,
  "body_preference": ["SUV", "Sedan"],
  "fuel_type": "Petrol",
  "transmission": "Automatic",
  "city": "Mumbai"
}
Response (200 OK):
{
  "experiment_variant": "Smart_Quiz_Variant_B",
  "total_inventory_scanned": 12,
  "matched_count": 4,
  "matches": [
    {
      "id": "car-01",
      "model": "Hyundai Creta SX(O)",
      "match_score": 96,
      "price_lakh": 14.85,
      "tco_3yr_lakh": 1.65,
      "inspection_rating": 9.4
    }
  ]
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "Every 1% increase in inquiry conversion across 50,000 monthly unique visitors delivers 500 additional qualified test-drive leads. At an average dealer take-rate of ₹25,000 per completed transaction and a 12% lead-to-sale conversion rate, this optimization produces ₹15 Lakh in monthly incremental gross revenue."
      }
    ]
  },
  evalguard: {
    title: "EvalGuard: LLM Evaluation & Regression Guardrail",
    category: "AI Product & Evaluation Engineering",
    targetCompanies: "Yellow.ai, Sarvam AI, Haptik, Gupshup, Ema",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "Customer-facing enterprise AI agents deployed for billing disputes and account services frequently suffer from prompt drift, unexpected schema hallucinations, and vulnerability to adversarial prompt injection. Without automated regression test suites, engineering teams deploy prompt updates that silently break previously functioning business workflows."
      },
      {
        heading: "2. Solution Architecture",
        body: "EvalGuard runs an automated evaluation pipeline validating prompts against a 20-case golden dataset prior to deployment. The engine evaluates 5 dimensions: deterministic JSON schema conformance, PII entity masking, adversarial injection defense, intent classification accuracy, and token efficiency. Ambiguous or low-confidence requests are routed to Human-in-the-Loop (HITL) queues."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "System maintains 95% or higher overall test suite accuracy, 100% defense against known prompt injection attempts, zero leaks of raw customer PII into generation outputs, and P95 execution latency below 1,200 milliseconds."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/eval/run-test
Headers:
  Content-Type: application/json
Request Body:
{
  "prompt_text": "I was double charged ₹1,499 on invoice #INV-8821. Please refund.",
  "expected_intent": "BILLING_DUPLICATE_DEBIT",
  "max_allowed_tokens": 300
}
Response (200 OK):
{
  "eval_status": "PASSED",
  "intent": "BILLING_DUPLICATE_DEBIT",
  "confidence": 94,
  "pii_masked": true,
  "injection_detected": false,
  "schema_valid": true,
  "action": "AUTO_REFUND_APPROVED",
  "latency_ms": 142,
  "tokens_consumed": 276
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "Automating resolution for 65% of repetitive duplicate billing inquiries removes manual Tier 1 ticket overhead. Cost per resolved dispute drops from ₹65 (human agent) to ₹2.40 (LLM token inference), saving ₹3.1 Lakh monthly per 5,000 incoming customer inquiries."
      }
    ]
  },
  payrouter: {
    title: "PayRouter: Multi-Gateway Router & Instant Refund Engine",
    category: "Fintech & Payment Orchestration",
    targetCompanies: "Razorpay, Cashfree, Pine Labs, Juspay, PayU",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "Indian direct-to-consumer and B2B platforms relying on a single payment aggregator face sudden checkout failures when bank UPI switches or card gateways experience latency spikes. Furthermore, delayed customer refunds lead to customer complaints, payment disputes, and chargeback penalties."
      },
      {
        heading: "2. Solution Architecture",
        body: "PayRouter implements automated smart cascade routing across Cashfree, Razorpay, Stripe, and PayU. When a gateway's latency exceeds 800 milliseconds or error rates exceed 5%, the router auto-cascades the transaction to the optimal backup rail. Cross-border cards are routed to Stripe for international BIN optimization. The instant refund engine uses cryptographic idempotency keys to verify ledger transactions and prevent double debits."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "Maintain overall payment success rate above 98%, reduce checkout latency below 250 milliseconds P95, achieve 100% double-debit prevention via idempotency keys, and settle instant refunds in under 150 milliseconds."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/payments/smart-route
Headers:
  Idempotency-Key: idemp_pay_891241
  Content-Type: application/json
Request Body:
{
  "amount_inr": 1499.00,
  "payment_method": "upi",
  "routing_strategy": "success_rate_priority",
  "customer_id": "cust_4412"
}
Response (200 OK):
{
  "transaction_id": "tx_771829",
  "status": "SETTLED",
  "selected_gateway": "cashfree",
  "latency_ms": 185,
  "fee_savings_inr": 2.25,
  "waterfall": [
    { "step": "INITIATED", "time_ms": 0 },
    { "step": "CASCADE_FALLBACK", "time_ms": 82 },
    { "step": "SETTLED", "time_ms": 185 }
  ]
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "On ₹10 Crore monthly gross merchandise value, recovering 3.2% of otherwise dropped transactions restores ₹32 Lakh in gross revenue. Routing international cards to optimized rails saves 45 bps in merchant discount rate (MDR), yielding ₹4.5 Lakh in annual fee reductions."
      }
    ]
  },
  flashqueue: {
    title: "FlashQueue: Virtual Waiting Room & Traffic Shaper",
    category: "High-Scale Systems & Infrastructure",
    targetCompanies: "BookMyShow, Zomato, Swiggy, Flipkart, Zepto",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "During high-demand flash drops and concert ticket sales, sudden traffic surges of 50,000 to 100,000 concurrent users overwhelm origin web servers, exhaust database connection pools, and trigger 504 Gateway Timeouts, crashing checkout for all users."
      },
      {
        heading: "2. Solution Architecture",
        body: "FlashQueue intercepts incoming traffic at edge worker nodes and holds users in a token-bucket virtual waiting room. Users receive a cryptographically signed HMAC token pass indicating their position in line and estimated wait time. As origin capacity permits (e.g. 500 TPS), the queue admits users in disciplined batches while routing bot scrapers into captcha quarantine."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "Zero 504 gateway timeouts on origin application servers, origin CPU utilization held between 60% and 75%, user cart drop-off under 5%, and 100% quarantine of automated ticket scalping bots."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/queue/admit-pass
Headers:
  X-Queue-Signature: hmac_sha256_sig_9921
  Content-Type: application/json
Request Body:
{
  "user_session_id": "sess_881924",
  "requested_event_id": "mumbai_concert_2026",
  "client_ip": "103.21.144.12"
}
Response (200 OK):
{
  "queue_status": "WAITING",
  "user_position": 1428,
  "total_in_queue": 50000,
  "estimated_wait_seconds": 134,
  "token_pass": "TK-PASS-44120",
  "origin_checkout_granted": false
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "Flash sales that crash lose up to 40% of their potential transaction volume to user frustration and competitor platforms. FlashQueue prevents origin infrastructure scaling costs by buffering traffic at low edge compute costs, saving ₹2.8 Lakh per major sales event in burst server provisioning."
      }
    ]
  },
  crewrostering: {
    title: "CrewRoster: Field Operations & SLA Escalation Dashboard",
    category: "Operations Research & Workforce Management",
    targetCompanies: "Urban Company, Shadowfax, Portea, Zomato, Zepto",
    sections: [
      {
        heading: "1. Problem Statement",
        body: "Grounded directly in NeoManpower on-ground operations managing up to 133 personnel across 200+ Mumbai events. Large commercial venues such as Jio World Convention Centre face last-minute staff no-shows (averaging 8% to 15%), shift bottlenecks at entry turnstiles, and manual supervisor payout reconciliations that delay event openings and breach client service level agreements."
      },
      {
        heading: "2. Solution Architecture",
        body: "CrewRoster provides an operational dashboard tracking real-time staffing across venue zones (Registration, Pavilions, VIP, Logistics). A live 15-minute SLA countdown timer triggers when staffing deficits are detected. Supervisors can deploy standby buffer personnel algorithmically with a single click, rebalancing staff to critical zones and maintaining 100% attendance and financial reconciliation accuracy."
      },
      {
        heading: "3. Target Metrics & Guardrails",
        body: "Zero on-ground SLA breaches across client contracts, 100% financial payout reconciliation accuracy, response time under 15 minutes for emergency staff redeployment, and maintaining a 15% standby reserve buffer across high-risk venue postings."
      },
      {
        heading: "4. Technical API Contract",
        code: `POST /api/v1/roster/deploy-standby
Headers:
  Authorization: Bearer <ops_token>
  Content-Type: application/json
Request Body:
{
  "venue_id": "jio_world",
  "target_zone": "hall_a_registration",
  "personnel_needed": 8,
  "sla_window_minutes": 15
}
Response (200 OK):
{
  "dispatch_id": "dsp_66192",
  "status": "DISPATCHED",
  "personnel_assigned": 8,
  "remaining_standby_buffer": 10,
  "sla_breach_prevented": true,
  "timestamp": "2026-11-02T10:15:00Z"
}`
      },
      {
        heading: "5. Unit Economics & ROI Impact",
        body: "In high-stakes corporate exhibitions, a client SLA breach incurs contract penalties ranging from ₹50,000 to ₹2,00,000 per incident. Automated standby dispatch and standardized QR check-in eliminated penalty exposure across 200+ events and reduced post-event vendor reconciliation from 4 days to under 15 minutes."
      }
    ]
  }
};

window.openProductSpec = function(productId) {
  const spec = window.ProductSpecs[productId];
  if (!spec) return;

  const titleEl = document.getElementById('spec-modal-title');
  const catEl = document.getElementById('spec-modal-category');
  const targetEl = document.getElementById('spec-modal-targets');
  const bodyEl = document.getElementById('spec-modal-body');
  const overlay = document.getElementById('spec-modal-overlay');

  if (titleEl) titleEl.textContent = spec.title;
  if (catEl) catEl.textContent = spec.category;
  if (targetEl) targetEl.textContent = spec.targetCompanies;

  if (bodyEl) {
    bodyEl.innerHTML = spec.sections.map(s => {
      if (s.code) {
        return `
          <div class="space-y-1.5 pt-3">
            <h4 class="text-sm font-medium text-white">${s.heading}</h4>
            <pre class="code-window">${escapeHtml(s.code)}</pre>
          </div>
        `;
      }
      return `
        <div class="space-y-1 pt-2">
          <h4 class="text-sm font-medium text-white">${s.heading}</h4>
          <p class="text-xs text-slate-300 leading-relaxed">${s.body}</p>
        </div>
      `;
    }).join('');
  }

  if (overlay) overlay.classList.add('active');
};

window.closeProductSpec = function() {
  const overlay = document.getElementById('spec-modal-overlay');
  if (overlay) overlay.classList.remove('active');
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

