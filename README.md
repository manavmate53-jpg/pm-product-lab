# Product Management Interactive Lab &middot; Manav Mate

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat&logo=github)](https://manavmate53-jpg.github.io/pm-product-lab/)
[![Portfolio](https://img.shields.io/badge/Portfolio-Manav%20Mate-emerald?style=flat)](https://manavmate53-jpg.github.io/portfolio/#hero)
[![License](https://img.shields.io/badge/Architecture-100%25%20Client--Side%20Static-purple?style=flat)](#zero-dependency-client-side-architecture)

An interactive, production-grade Product Management Portfolio Lab built for evaluating early-career PM candidates in under 60 seconds. Instead of static slide decks, this suite lets hiring managers and recruiters interact with 6 simulated software products, inspect live JSON payloads, run PostgreSQL queries, and review full PRD specifications.

Live URL: **https://manavmate53-jpg.github.io/pm-product-lab/**

---

## The 6 Interactive Products

### 1. VeriShield: B2B Merchant KYC & Document Risk Engine
*Target Domains: Fintech, RegTech, Risk Operations (HSBC, IDfy, Equifax, Firmway)*

* **The Problem:** 38% merchant drop-off during B2B onboarding caused by legacy exact-string matching and slow 4 to 24 hour manual review queues.
* **The Solution:** Automated 15-character GSTIN format validation, 10-character PAN regex check, embedded PAN cross-match, Levenshtein string distance algorithm, and 3-tier confidence routing.
* **Interactive Features:**
  * 1-Click Merchant Presets (Clean Auto-Approve, Fuzzy Name Mismatch, and High-Risk Checksum Discrepancy).
  * Real-time regex and Levenshtein similarity calculation as you type.
  * 4-Stage Verification Pipeline Step Loader.
  * Dark-themed JSON API Request & Response payload viewer (`POST /v1/kyc/verify-merchant`).
  * Live Ops Decision Queue with timestamped Compliance Audit Trail logging.
* **Key PM Artifact:** Technical PRD covering straight-through processing (STP) targets (75%+), turnaround time reduction (4 hours down to 8 seconds), and false positive rejection reduction (14.2% down to <1.8%).

---

### 2. AutoMatch IQ: High-Intent Marketplace Discovery & Funnel Telemetry
*Target Domains: Consumer Marketplaces, Growth Analytics (CarTrade Tech, OLX India, Coverfox, Ketto)*

* **The Problem:** 88.8% funnel drop-off driven by the "Paradox of Choice". Buyers faced with 18+ unranked filters experience decision paralysis and abandon without booking an inspection.
* **The Solution:** A 3-step progressive intent questionnaire (Commute Pattern &rarr; Monthly TCO Comfort &rarr; Must-Have Priority) surfacing the Top 3 ranked recommendations.
* **Interactive Features:**
  * Rich local dataset of 18 realistic Mumbai used vehicle listings across Andheri, Powai, Bandra, Thane, and BKC.
  * A/B Experiment Mode Switcher: Compare cognitive overload between Legacy Filters (Control) vs. Smart Progressive Matcher (Variant B).
  * Side-by-Side Trade-Off & 3-Year TCO Comparison Matrix with doorstep inspection booking CTA.
  * Live PM Event Stream Console logging real-time JSON tracking events.
  * A/B Funnel Conversion Chart (Chart.js) demonstrating a +121% conversion uplift (24.8% vs 11.2%).
  * Interactive PostgreSQL Analytics Runner with 3 clickable query presets.
* **Key PM Artifact:** Comprehensive PRD with event tracking taxonomy matrix, zero-result fallback cascade, and 15-minute dealer response SLA guardrails.

---

### 3. EvalGuard AI: Production Workflow Agent with Evals, Guardrails & Token Economics
*Target Domains: AI Systems, LLM Ops, Developer Tools (BOMBAYDC, LearnTube, AI Startups)*

* **The Problem:** Naive LLM prompt wrappers suffer from prompt injection vulnerabilities, malformed JSON outputs, and runaway token expenses.
* **The Solution:** Multi-tier deterministic guardrails combining regex PII masking, Llama-Guard injection shields, Pydantic schema enforcement, and confidence-based Human-In-The-Loop (HITL) routing.
* **Interactive Features:**
  * 4 Realistic Test Cases: Duplicate billing dispute, ambiguous policy exception, adversarial injection attack, and donor campaign synthesis.
  * Model Selector: Compare Llama 3.1 8B (NVIDIA NIM), Llama 3.1 70B, and GPT-4o.
  * Interactive Confidence Slider: Tune HITL escalation thresholds (50% to 95%).
  * Real-Time Token Unit Economics Calculator: Latency, cost per 1,000 requests, and monthly cost projection at 100k requests/month (demonstrating 86.4% savings on Llama 3.1 8B).
  * Batch Regression Eval Suite: Animated 20-case test runner with summary scorecard (100% schema compliance, 0% hallucination rate, 440ms P95 latency).
* **Key PM Artifact:** System prompt architecture, 4 quantitative evaluation rubrics, fallback escalation matrix, and compute cost optimization strategy.

---

### 4. PayRouter Engine: Multi-Gateway Payment Router & Instant Refund Reconciliation
*Target Domains: Fintech Rails, Payment Aggregators (Razorpay, Cashfree, Juspay, Pine Labs)*

* **The Problem:** 4% to 8% checkout transaction drop-offs caused by unexpected bank switch downtime, high merchant discount rate (MDR) surcharges, and duplicate payout race conditions during customer refund disputes.
* **The Solution:** Real-time health watchdog routing across Cashfree, Razorpay, Stripe, and PayU with sub-200ms cascade failover, fee/MDR optimization, and automated refund idempotency locking.
* **Interactive Features:**
  * 3 Clickable Payment Scenarios: UPI Flash HDFC Spike, International Corporate Card Invoice, and Duplicate Charge Instant Refund.
  * Live Multi-Gateway Health Grid with P95 latency and success rate monitors.
  * Waterfall Execution Timeline tracking payment intent through risk checks and failover triggers.
  * Real-time MDR fee savings calculator (15 to 45 bps discount).
  * Live JSON Webhook and Idempotency Key Lock inspector.
* **Key PM Artifact:** Technical PRD covering cascading state machines, ISO-8583 payment contracts, idempotency lock specifications, and 98.2%+ success rate SLOs.

---

### 5. FlashQueue Simulator: High-Concurrency Virtual Waiting Room & Bot Shield
*Target Domains: Infrastructure, High-Traffic Platforms (BookMyShow, Flipkart, IRCTC, Swiggy)*

* **The Problem:** Sudden traffic surges (concert drops, phone flash sales) overwhelm origin servers, triggering database connection pool exhaustion and HTTP 504 Gateway Timeouts.
* **The Solution:** Edge token bucket buffer that smoothly meters traffic admission to origin servers while fingerprint velocity heuristics isolate scalper bot waves into Captcha rooms.
* **Interactive Features:**
  * 3 Concurrency Presets: 50,000 Stadium Concert Surge, Flagship Smartphone Bot Wave, and Origin Database Saturation.
  * Interactive Traffic Influx (1k to 100k) and Origin TPS Capacity (100 to 2,000 TPS) sliders.
  * Live Consumer Queue Perspective Card showing live queue position (#1,428), estimated wait time (2m 14s), and cryptographic HMAC token pass.
  * Real-time metrics counters for Queued Users, Admitted Rate, Abandonment Rate, and Origin CPU load.
  * Simulated Surge Injection (+10,000 users) and Step Drain queue buttons.
* **Key PM Artifact:** Comprehensive PRD specifying token bucket algorithms, Cloudflare Workers / Lambda@Edge integration, cart lock TTL rules, and zero-downtime origin protection.

---

### 6. CrewRoster Dashboard: Field Crew Rostering & On-Ground SLA Escalation
*Target Domains: Operations PM, Labor Logistics (Urban Company, Zepto, Porter, Shadowfax)*

* **The Problem:** Managing on-ground frontline teams across multi-venue events suffers from 15% to 25% morning staff no-shows, manual shift check-in bottlenecks, and steep client contractual penalties for unmanned posts.
* **Grounded in NeoManpower Track Record:** Modeled directly on Manav Mate's experience as Founder & Operations Lead running 200+ commercial projects and managing teams of up to 133 personnel across Mumbai venues with zero SLA breaches.
* **Interactive Features:**
  * 3 Real Mumbai Venue Scenarios: Jio World Convention Centre BKC (120 crew), NESCO Goregaon (85 crew), and Taj Lands End Bandra (45 crew).
  * Interactive Standby Reserve Crew Buffer slider (5% to 25%).
  * Simulated 14 Staff No-Shows Incident Trigger activating the 15-minute emergency SLA countdown timer.
  * Standby Crew Dispatch button automatically backfilling critical venue deficits in under 12 minutes.
  * Zone Staff Density Heatmap covering Registration Desks, Hall Perimeters, VIP Hospitality, and Loading Bays.
  * Automated QR Hours & Vendor Payout Reconciliation audit tool verifying 100% financial accuracy with zero cost variance.
* **Key PM Artifact:** Operations PRD covering reserve labor buffer economics, geo-fenced QR check-in protocols, incident escalation matrices, and 100% SLA compliance benchmarks.

---

## Zero-Dependency Client-Side Architecture

To guarantee 100% uptime on static hosting platforms like GitHub Pages, this project relies on zero backend servers and zero external API keys:

* **Markup & Structure:** Semantic HTML5 with clean component isolation.
* **Styling & Design System:** Tailwind CSS via CDN with customized dark enterprise SaaS tokens.
* **Icons & Visuals:** Lucide Icons via CDN for crisp iconography.
* **Data Visualization:** Chart.js via CDN for interactive A/B test conversion funnels.
* **Logic & Pipelines:** Modular Vanilla ES6 JavaScript (`verishield.js`, `automatch.js`, `evalguard.js`, `payrouter.js`, `flashqueue.js`, `crewrostering.js`, `app.js`).
* **Data Layer:** Rich local JSON datasets for instant loading with zero network latency.

---

## Local Development & Preview

1. Clone or navigate to the repository directory:
   ```bash
   cd /Users/manav/.gemini/antigravity-ide/scratch/pm-product-lab
   ```

2. Start any local static server:
   ```bash
   # Using Python 3
   python3 -m http.server 4322
   ```

3. Open `http://localhost:4322` in your browser.

---

## Author & Contact

* **Name:** Manav Mate
* **Target Roles:** Associate Product Manager, Product Analyst, AI Product Builder
* **Location:** Mumbai, Maharashtra, India
* **Portfolio:** [manavmate53-jpg.github.io/portfolio](https://manavmate53-jpg.github.io/portfolio/#hero)
* **GitHub:** [github.com/manavmate53-jpg](https://github.com/manavmate53-jpg)
* **LinkedIn:** [linkedin.com/in/manav-mate-9448b1341](https://www.linkedin.com/in/manav-mate-9448b1341/)
* **Email:** manavmate53@gmail.com
* **Phone:** +91 85915 95889
