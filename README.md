# Product Management Interactive Lab &middot; Manav Mate

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat&logo=github)](https://manavmate53-jpg.github.io/pm-product-lab/)
[![Portfolio](https://img.shields.io/badge/Portfolio-Manav%20Mate-emerald?style=flat)](https://manavmate53-jpg.github.io/portfolio/#hero)
[![License](https://img.shields.io/badge/Architecture-100%25%20Client--Side%20Static-purple?style=flat)](#zero-dependency-client-side-architecture)

An interactive, production-grade Product Management Portfolio Lab built for evaluating early-career PM candidates in under 60 seconds. Instead of static slide decks, this suite lets hiring managers and recruiters interact with 3 simulated software products, inspect live JSON payloads, run PostgreSQL queries, and review full PRD specifications.

Live URL: **https://manavmate53-jpg.github.io/pm-product-lab/**

---

## The 3 Interactive Products

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
  * Dynamic Confidence Slider: Tune HITL escalation thresholds (50% to 95%).
  * Real-Time Token Unit Economics Calculator: Latency, cost per 1,000 requests, and monthly cost projection at 100k requests/month (demonstrating 86.4% savings on Llama 3.1 8B).
  * Batch Regression Eval Suite: Animated 20-case test runner with summary scorecard (100% schema compliance, 0% hallucination rate, 440ms P95 latency).
* **Key PM Artifact:** System prompt architecture, 4 quantitative evaluation rubrics, fallback escalation matrix, and compute cost optimization strategy.

---

## Zero-Dependency Client-Side Architecture

To guarantee 100% uptime on static hosting platforms like GitHub Pages, this project relies on zero backend servers and zero external API keys:

* **Markup & Structure:** Semantic HTML5 with clean component isolation.
* **Styling & Design System:** Tailwind CSS via CDN with customized dark enterprise SaaS tokens.
* **Icons & Visuals:** Lucide Icons via CDN for crisp iconography.
* **Data Visualization:** Chart.js via CDN for interactive A/B test conversion funnels.
* **Logic & Pipelines:** Modular Vanilla ES6 JavaScript (`verishield.js`, `automatch.js`, `evalguard.js`, `app.js`).
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
