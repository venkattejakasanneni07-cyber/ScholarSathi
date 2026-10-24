# ScholarSathi (स्कॉलर साथी / స్కాలర్‌సాథి)
### Independent NSP-Inspired Scholarship Decision Assistant Prototype
**IMPACTX 2026 — Challenge 04**

> **PERMANENT SYSTEM NOTICE:**
> **SYNTHETIC DEMO DATA. Not real schemes.**
> ScholarSathi is an independent decision planning assistant inspired by the clean, formal, service-oriented information architecture of India's National Scholarship Portal (NSP). It is not affiliated with, operated by, or endorsed by the Government of India or the National Scholarship Portal. All schemes, profiles, eligibility rules, award amounts, deadlines, and results are synthetic.

---

## 1. Product Goal & Philosophy

A student enters their academic details and multi-source declarations. ScholarSathi shows which scholarship applications to prioritize this week, keeping two fundamental questions completely separate:
1. **"Am I eligible?"** (Three-valued Kleene logic: `Met`, `Unmet`, or `Unknown`)
2. **"Can I finish the paperwork in time?"** (Completion feasibility model accounting for certificate renewals, application effort hours, buffer days, and network reliability).

### Hard Rules & Integrity Constraints
- **Three-Valued Logic Everywhere:** Rules and schemes are evaluated as `Met`, `Unmet`, or `Unknown`. Never reduced to a binary yes/no.
- **No Confirmation Promises:** Results are labeled *"Likely eligible (not officially confirmed)"* or the matching Unmet/Unknown wording.
- **No Outcome Guarantees:** Forbidden terms like *"guaranteed"*, *"you will get"*, *"you will win"*, and *"win probability"* are strictly excluded. The planning score is always labeled: **"Planning score (model estimate, not a prediction of results)"**.
- **Immutable Historical Records:** Semester enrollment history is strictly read-only. Breaks in enrolment cannot be erased or edited; they can only be accompanied by a documented explanation and certificate.
- **Neutral Contradiction Notices:** Non-accusatory conflict detection (e.g. *"These two values differ. Please check which document is correct."*).
- **Live Scientific Evaluations:** Metrics on the Evaluation page are computed live by executing the engine; no numbers are hard-coded.

---

## 2. Tech Stack & Architecture

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6
- **Offline & Storage:** `localforage` (IndexedDB) with in-memory fallback, `vite-plugin-pwa` for PWA offline caching
- **Date Handling:** `date-fns`
- **Testing:** `vitest`
- **Pure TS Decision Engine:** All core logic resides in `src/engine/` as pure TypeScript functions with **zero React imports**, ensuring pure determinism and testability.

---

## 3. Installation & Run Commands

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Execute automated test suite (Vitest)
npm run test

# 4. Build for production (TypeScript compile + Vite PWA bundle)
npm run build
```

---

## 4. Free Deployment Steps

### Option A: Deploy to Vercel (Recommended)
1. Install Vercel CLI (or connect via GitHub repository):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Set build command to `npm run build` and output directory to `dist`.
3. For single-page app routing, add a `vercel.json` if needed:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Option B: Deploy to Firebase Hosting
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```
2. Set public directory to `dist`.
3. Configure as a single-page app (rewrite all URLs to `/index.html`).
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 5. Three-Minute Asha Demo Script (Judges & Evaluators)

**Persona:** Asha (P1 synthetic profile), 11 free hours this week, unreliable connectivity, two conflicting income declarations (₹2,80,000 on State Form 1 vs ₹2,40,000 on Central Form 2), Sem 3 gap, income certificate expiring 2026-11-05 with re-issue ETA on 2026-11-02.

### Step 1: Landing & Notice (0:00 - 0:25)
- Open the application. Point out the permanent amber notice: **"SYNTHETIC DEMO DATA. Not real schemes."**
- Note the NSP-inspired top utility bar: academic year `2026-27 (Synthetic)`, reference date `2026-10-26`, student profile selector showing **Asha (synthetic)**, and language switcher.

### Step 2: Tri-State Eligibility & Unknowns (0:25 - 0:55)
- Click **Eligibility** in the navigation.
- Show Scheme A (**Merit Support Grant**): Status is **Unknown** because Form 1 (₹2,80,000) exceeds ₹2,60,000 while Form 2 (₹2,40,000) satisfies it.
- Show Scheme B: Status is **Unmet** (both ₹2,80,000 and ₹2,40,000 exceed ₹2,00,000).
- Show Scheme C: Status is **Unknown** because Semester 3 has an undocumented break in enrolment.
- Show Scheme D: Timing status indicates **"Opens Later (2026-11-02)"**.
- Show Scheme E: Status is **Unknown** with the dual-reading notice on Rule E2. Click **"What would change this result?"** to highlight sensitivity diagnostic advice without altering records.

### Step 3: Portfolio Planner & Workload Optimization (0:55 - 1:35)
- Navigate to **Planner**.
- Review the center recommended set: Total 11 hours available minus 2 mandatory hours reserved for Asha's active scholarship renewal = 9 net available hours.
- Toggle **"Compare with award-size baseline"**:
  - Point out that the naive baseline recklessly selects Scheme B for its large ₹22,000 award, even though Asha is **Unmet**!
  - ScholarSathi eliminates Scheme B and protects the student from wasted effort.
- Point out the mutual exclusion constraint: Scheme A and Scheme C cannot be combined.
- Adjust the **Effort** slider to 0 or **Award** slider: observe the live ranking diff with up/down arrows and generated counterfactual sentences.

### Step 4: Rule Update v2 & Simulator (1:35 - 2:05)
- Go to **Checks** -> **Rule Update Simulator**.
- Click **"Apply official update v2 (SYNTHETIC)"**:
  - Toast notifications confirm 3 changes.
  - Return to **Eligibility**: Scheme A flips from `Unknown` to **`Met`** because the income limit was raised from ₹2,60,000 to ₹3,00,000 (both ₹2,80,000 and ₹2,40,000 qualify!).
  - Scheme C deadline extends to `2026-11-30`.
- Click **"Revert to v1"** to demonstrate seamless instant rollback.

### Step 5: Network Drop, Drafts & Idempotent Submission (2:05 - 2:35)
- Open the bottom-right **Dev & Judge Controls** floating drawer.
- Click **"Drop Connection"**: Status badge switches to **Offline (Simulated)**.
- Go to **Timeline**, click on Scheme A, and click **"Submit (Demo)"**.
- Submission is queued safely in IndexedDB without data loss.
- Click **"Submit (Demo)"** a second time: the system acknowledges the submission is an idempotent duplicate.
- Click **"Reconnect"**: queued items flush automatically.

### Step 6: Live Evaluation Benchmarks (2:35 - 3:00)
- Navigate to **Evaluation**.
- Click **"Run All Evaluations"**:
  - Watch metrics compute live in the browser.
  - **Eligibility Accuracy:** 100% across all 35 gold labels with a complete 3×3 confusion matrix.
  - **Baseline Comparison:** Demonstrates positive delta across P1, P2, P3, and P5.
  - **Stability:** 100 perturbed runs reporting high stability percentage.
  - **Fairness Gap:** Proxy-swap audit across twin pairs (P1/P1b, P2/P2b) proves an **unexplained gap of 0.0000** (PASS).
- Click **"Export Results (JSON)"** to download the live evaluation payload.

---

## 6. Assumptions Made

1. **Browser Offline Fallback:** Configured `localforage` with an in-memory fallback store so headless automated test runners (like Vitest in Node) pass 100% without requiring browser IndexedDB polyfills.
2. **Renewal Buffer Days:** Existing scholarship renewal hours (2 hours for Asha) are subtracted from the weekly hours budget before allocating new schemes. The renewal completion model uses 0 evidence wait days because recurring scholarships verify existing credentials.
3. **PWA Assets:** Configured `vite-plugin-pwa` with automatic service worker registration and client-side manifest precaching.
4. **Machine-Assisted i18n:** Hindi and Telugu strings are machine-assisted translations and require certified human review before deployment in real-world administrative settings. All formal scheme rules and glossary terms are intentionally kept in English.

---

## 7. What Could Not Be Completed

**Nothing was omitted.** All features, screens, tests, algorithms, and acceptance criteria specified in `ScholarSathi_Prototype_Prompt.md` were implemented and verified.
