# Product Review, Production Readiness Audit & Fixing Roadmap

**Product:** IELTS Writing Assistant Platform  
**Target Market:** IELTS Academic & General Candidates, Test Preparation Centers, Private Tutors  
**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Google Gemini Generative AI, Turso (LibSQL) / Supabase, jsPDF  
**Review Perspective:** Senior Product Manager & Production Systems Architect  

---

## 1. Executive Summary: Can This Project Survive?

### 1.1 The Verdict
**Yes — the project has high survival potential and a distinct commercial wedge, provided it fixes critical architectural and data persistence gaps before launching to real users.**

Unlike generic "AI Essay Polishers" or ChatGPT wrappers that act as passive essay rewriters (which actively harm student learning by fostering dependency without improving test-day writing speed or recall), this platform has three strong, defensible product differentiators:

1. **Active Pedagogical Scaffolding (Socratic Method):** Instead of rewriting sentences for the student, the system asks guided questions based on target band rubrics (Bands 5.0 to 9.0), prompting active revision.
2. **Anti-Paste Learning Guard:** Strictly blocks copy-paste and drag-and-drop text injection, enforcing authentic keyboard typing, muscle memory, and active vocabulary recall under timed exam simulations.
3. **Dual-Layer Evaluation & Viral Utility:** Separates standard objective examiner band scoring (Layer 1) from personal target-gap roadmaps (Layer 2), supported by downloadable official-grade Test Report Form (TRF) PDFs and one-click Telegram sharing.

### 1.2 Production Readiness Scorecard

| Dimension | Readiness | Status Summary |
| :--- | :---: | :--- |
| **Writing Workspace & Core UX** | **90%** | Polished UI, word counter, countdown timers, Task 1 visual illustration canvases, and export options. |
| **Pedagogical Concept & Rubrics** | **80%** | Clear band descriptor criteria, actionable advice, dynamic band target recalibrations. Needs Task 1 vs. Task 2 prompt branching. |
| **AI Integration & Guardrails** | **65%** | Robust prompt sanitization & prompt injection guardrails, but invalid model names cause silent fallback to mock engines. |
| **User Authentication & Authorization** | **25%** | **Insecure & Mocked.** Any credentials $\ge 4$ characters log in; admin password is committed to repository; user session resides only in `localStorage`. |
| **Data Persistence & State Management** | **30%** | Prompts are persisted, but **student drafts, active timer states, and submission histories exist only in volatile client-side memory** (`store.ts`). Tab refreshes discard work. |
| **Admin & Operational Intelligence** | **20%** | High-fidelity UI, but 100% powered by static mock data. Zero visibility into real active users or live token spend. |
| **Monetization & Quota Architecture** | **10%** | No rate/tier gating, free-tier limits, or payment integration. |
| **OVERALL PRODUCTION READINESS** | **~55%** | **Polished Interactive Prototype / Demo Stage.** Not yet hardened for public multi-tenant traffic. |

---

## 2. In-Depth Technical & Architectural Issues

### 2.1 Invalid Model Identifiers Causing Silent Fallbacks
* **Location:** [`src/app/api/evaluation/route.ts`](src/app/api/evaluation/route.ts#L45) & [`src/app/api/guidance/route.ts`](src/app/api/guidance/route.ts#L44)
* **Root Cause:**
  ```typescript
  const candidateModels = ['gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  ```
  `gemini-3.7-flash`, `gemini-3.8-flash`, and `gemini-3.5-flash` do not exist as valid public Google Gemini API models.
* **Production Failure:** Every request throws errors on the first three candidate attempts, increasing request latency. If the last fallback fails, the platform silently degrades to `generateMockSubmissionEvaluation()`. In mock mode, any essay reaching 250 words automatically gets a static Band 7.0 score with pre-baked commentary, leading to inaccurate user evaluations.

### 2.2 Uncontrolled AI Triggering & Token Cost Inflation
* **Location:** [`src/components/EditorSurface.tsx`](src/components/EditorSurface.tsx#L243-L308)
* **Root Cause:**
  `triggerAnalysis` is executed on:
  1. Every 30 words typed
  2. Every 2 complete sentences
  3. Every paragraph break (Enter twice)
  4. The first sentence of each paragraph
  5. Any conclusion signal detected
  6. **Every 3-second typing pause** (`setTimeout` at 3000ms)
* **Production Failure:** A normal student writing a 40-minute essay will pause dozens of times. This can trigger 20 to 45 background LLM calls per draft session. For 1,000 active students, this could result in 20,000–45,000 API calls per day, rapidly exhausting API rate limits and driving up token costs.

### 2.3 Fragile In-Memory Rate Limiting in Serverless Architecture
* **Location:** [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts#L8-L24)
* **Root Cause:**
  ```typescript
  const rateLimitMap = new Map<string, RateLimitRecord>();
  ```
  Rate limits are maintained in an in-memory `Map`.
* **Production Failure:**
  - In serverless hosting (Vercel, AWS Lambda), memory is not shared across function instances. A user can bypass rate limits simply by hitting different lambdas.
  - Rate limiting is keyed by Client IP (`checkRateLimit`). In physical test centers or universities where dozens of students share an egress IP/NAT, one student writing an essay will trigger the 30 req/min limit, causing `429 Too Many Requests` errors for all other students on that network.

### 2.4 Complete Lack of Draft Persistence (Data Loss Risk)
* **Location:** [`src/lib/store.ts`](src/lib/store.ts#L66-L173)
* **Root Cause:**
  The Zustand store manages `essayText`, `wordCount`, `elapsedSeconds`, and `history` purely in browser memory without local storage synchronization or server autosaving.
* **Production Failure:** If a student accidentally presses back, refreshes the page, or experiences a mobile browser reload during a 40-minute essay, the entire text and timer are lost.

### 2.5 Insecure Authentication & Hardcoded Credentials
* **Location:** [`src/app/api/auth/login/route.ts`](src/app/api/auth/login/route.ts#L5-L79), [`src/lib/auth-service.ts`](src/lib/auth-service.ts), [`README.md`](README.md#L14)
* **Root Cause:**
  - Admin credentials (`shuhrat3` / `$Huhrat333`) are documented publicly in `README.md` and hardcoded as defaults in source code.
  - Standard login accepts *any* password of 4 or more characters without checking a database or verifying hashes.
  - Admin access on `/admin` is verified solely via `localStorage.getItem('ielts_auth_session_user')` and checking `user.role === 'admin'`. Any user can edit their `localStorage` to gain access to the admin panel.

### 2.6 Unauthenticated Prompt Creation API
* **Location:** [`src/app/api/prompts/route.ts`](src/app/api/prompts/route.ts#L194-L282)
* **Root Cause:**
  The `POST /api/prompts` endpoint allows anyone to write directly to the database without session or admin authentication.
* **Production Failure:** Malicious actors or automated scrapers can inject arbitrary, offensive, or malformed prompts into the production database.

### 2.7 Render Side-Effect Bug in Report Modal
* **Location:** [`src/components/DualLayerReportModal.tsx`](src/components/DualLayerReportModal.tsx#L49-L55)
* **Root Cause:**
  `confetti()` is invoked directly in the root of the React component render function rather than inside a `useEffect`.
* **Production Failure:** Whenever the user switches tabs (between Layer 1 Examiner and Layer 2 Target Alignment) or copies text, the component re-renders and re-fires the confetti animation repeatedly.

---

## 3. Product & Pedagogical Gaps

### 3.1 Rubric Mismatch: Task 1 (Academic/General) vs. Task 2
* **The Gap:**
  In [`src/app/api/evaluation/route.ts`](src/app/api/evaluation/route.ts#L79-L86), the prompt blueprint hardcodes:
  `"Paragraph 1 (Hook + Thesis), Body Paragraph 1 (PEEL framework), Body Paragraph 2 (Counter-argument / alternative with PEEL), Conclusion"`.
* **Pedagogical Impact:**
  - This structure applies only to **Task 2 Argumentative Essays**.
  - For **Task 1 Academic** (visual data report), candidates must write an **Overview of main trends** and two detail paragraphs with data; including personal thesis statements or counter-arguments will lower their score.
  - For **Task 1 General** (Letter), candidates must address 3 specific bullet points with appropriate formal/semi-formal/informal salutations and sign-offs. Evaluating a Task 1 response using a Task 2 system prompt yields misleading feedback.

### 3.2 Lack of Inline Diagnostic Diffing
* **The Gap:**
  The evaluation modal offers strong high-level feedback (band breakdowns, collocations, grammar patterns), but does not display inline sentence-by-sentence annotations directly on the student's text.
* **Pedagogical Impact:** Students often struggle to pinpoint exactly which sentence contained an error. Providing visual highlights for subject-verb disagreements, awkward prepositions, or informal phrasing would improve clarity.

### 3.3 Device Asymmetry: Mobile Friction vs. Desktop Reality
* **The Gap:**
  The official Computer-Delivered IELTS exam requires typing on a physical keyboard. Anti-paste protection on mobile touchscreens can frustrate users who simply want to read topics or review sample responses.
* **Pedagogical Impact:**
  - Desktop should remain the primary exam simulation surface.
  - Mobile visitors (often arriving from Telegram links) should be offered a streamlined "Read & Review" or "Outline Practice" mode rather than requiring a full 250-word typed essay.

### 3.4 Disconnected Admin Dashboard
* **The Gap:**
  [`src/lib/admin-service.ts`](src/lib/admin-service.ts) provides static hardcoded data (e.g., 1,428 submissions, 7.2 average band) rather than reading from Turso/Supabase.
* **Operational Impact:** Administrators cannot monitor actual user volume, real token spend, or platform usage metrics.

---

## 4. Business & Unit Economics Viability

### 4.1 Cost per User Session (Gemini 2.5 / 2.0 Flash)
* Average prompt context: ~1,500 input tokens.
* Evaluation output: ~1,200 output tokens.
* Real-time guidance cards: ~400 tokens per call $\times$ 5 calls per session = ~2,000 tokens.
* **Total cost per completed essay:** Approximately **\$0.003 – \$0.006** per essay.
* **Verdict:** The operational margins are healthy. A free tier offering **2 free evaluations per day**, combined with a **\$9–\$15/month Pro Subscription** (or B2B licensing for language schools at \$2/student/month), would support a sustainable business model.

---

## 5. Comprehensive Fixing & Implementation Roadmap

```mermaid
flowchart TD
    subgraph Phase 1: Critical Stabilization
        P1_1[Fix Gemini Models in API Routes] --> P1_2[Debounce & Throttle Live Guidance Triggers]
        P1_2 --> P1_3[Implement Zustand Draft Persistence]
        P1_3 --> P1_4[Fix Confetti Re-render Bug]
        P1_4 --> P1_5[Branch Task 1 vs Task 2 Evaluation Prompts]
    end

    subgraph Phase 2: Security & Authentication
        P2_1[Sanitize Admin Secrets & Env Variables] --> P2_2[Secure Admin Dashboard with Session Verification]
        P2_2 --> P2_3[Protect POST /api/prompts Endpoint]
        P2_3 --> P2_4[Redis/Upstash Distributed Rate Limiting]
    end

    subgraph Phase 3: Real Persistence & Admin Sync
        P3_1[Persist Student Submissions to Database] --> P3_2[Connect Admin Analytics to Real DB Metrics]
        P3_2 --> P3_3[Student Performance History & Band Progress Chart]
    end

    subgraph Phase 4: Monetization & Growth Loops
        P4_1[Daily Free Quota System] --> P4_2[Telegram Bot Integration]
        P4_2 --> P4_3[B2B Language School Portal]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
```

### Phase 1: Critical Stabilization (Completed)
- [x] **Fix Gemini Models:** Replaced invalid model strings in `evaluation/route.ts` and `guidance/route.ts` with valid options (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
- [x] **Throttle Guidance Triggers:**
  - Increased debounce pause timer from 3s to 7s.
  - Required a minimum delta of 15 words since the last analysis call before allowing another request.
- [x] **Add Local Storage Persistence to Zustand Store:**
  - Used `persist` middleware on `useWritingStore` so that `essayText`, `currentPrompt`, and `elapsedSeconds` survive tab refreshes.
- [x] **Resolve Confetti Render Bug:**
  - Moved `confetti()` into a `useEffect` keyed on `report.id` in `DualLayerReportModal.tsx`.
- [x] **Differentiate Evaluation Prompts:**
  - Updated `api/evaluation/route.ts`, `api/guidance/route.ts`, and `ai-service.ts` to apply tailored evaluation blueprints for `TASK_1_ACADEMIC` (Overview + Key Features), `TASK_1_GENERAL` (Purpose + Bullets + Tone), and `TASK_2_ESSAY` (Thesis + Arguments).

### Phase 2: Security & Authentication Hardening (Completed)
- [x] **Protect Admin Route:** Removed plaintext credentials from `README.md` and fallback defaults; implemented cryptographically signed HMAC-SHA256 admin session tokens (`server-auth.ts`) verified server-side via `/api/auth/verify-admin`.
- [x] **Secure Prompt Creation:** Protected `POST /api/prompts` so that only verified platform administrators can persist prompts into the global database; unauthenticated or student requests generate isolated local prompts without database pollution.
- [x] **Shared Rate Limiting Context:** Upgraded `rate-limit.ts` to key by cryptographic auth token / session ID when present, preventing whole classrooms sharing a single NAT or campus IP from being blocked.

### Phase 3: Real Data Persistence & Operational Analytics (Completed)
- [x] **Persist Submissions:** Implemented `persistSubmissionAndReport()` in `submission-repository.ts` and connected `api/evaluation/route.ts` to automatically store student submissions and Dual-Layer reports in Turso/Supabase.
- [x] **Connect Admin Dashboard:** Created `api/admin/analytics/route.ts` and updated `admin-service.ts` to query real database KPIs (total essays, average band, distribution, recent activity) with a live sync button.
- [x] **User Progress Tracking:** Created `SubmissionHistoryModal.tsx` and integrated it into the Practice Workspace Navbar, allowing students to review past essays, monitor their average and highest band scores, and re-export past PDF/Telegram reports.

### Phase 4: Monetization & Scaled Growth (Completed)
- [x] **Usage Quotas & Unit Economics Guard:** Implemented `quota-service.ts` enforcing a 2-free-evaluation daily limit with UTC midnight resets, persistent client quota tracking in `store.ts`, a visible live badge in `EditorSurface.tsx`, and the `QuotaExceededModal.tsx` component with countdown timer and upgrade pathways.
- [x] **Direct Telegram Sharing & Public Report Links:** Implemented shareable public report deep-links via `/report/[id]` (`src/app/report/[id]/page.tsx`) backed by `fetchReportById()` in `submission-repository.ts` (bounded memory cache + Turso/Supabase lookup) and public `GET /api/reports/[id]`, OpenGraph/Twitter preview metadata, shared `ReportDetailsTabs.tsx` component, collapsible essay transcript, "Copy Link" button in `DualLayerReportModal.tsx`, dynamic `getPublicReportUrl()` in `pdf-service.ts`, and one-click "Practice This Exact Topic Now" deep-linking into `/workspace?promptId=...`.
- [x] **Inline Sentence-Level Error & Collocation Highlights:** Implemented [`sentence-annotations.ts`](src/lib/sentence-annotations.ts) (verbatim quote resolution, deterministic grammar/collocation/coherence/strength scanner, and Gemini post-processing validator), extended `/api/evaluation` and `ai-service.ts` to produce `sentenceAnnotations`, built interactive [`InlineEssayHighlighter.tsx`](src/components/InlineEssayHighlighter.tsx) with category filter pills, click-to-inspect spans, and Prev/Next suggestion navigation, and mounted it in Layer 2 of `ReportDetailsTabs.tsx`.
- [x] **B2B School Features:** Implemented end-to-end B2B cohorts & teacher portal across [`src/types/b2b.ts`](src/types/b2b.ts), [`src/lib/b2b-repository.ts`](src/lib/b2b-repository.ts), [`supabase/schema.sql`](supabase/schema.sql), HMAC session verification in [`src/lib/server-auth.ts`](src/lib/server-auth.ts), `/api/auth/teacher`, `/api/cohorts`, `/api/cohorts/join`, `/api/cohorts/[id]`, `/api/cohorts/[id]/assignments`, `/api/cohorts/[id]/submissions`, automatic cohort submission linking in `/api/evaluation`, the dedicated [`src/app/teacher/page.tsx`](src/app/teacher/page.tsx) portal (with [`AssignPromptModal.tsx`](src/components/teacher/AssignPromptModal.tsx) and [`CohortSubmissionReviewModal.tsx`](src/components/teacher/CohortSubmissionReviewModal.tsx)), and student [`ClassroomsModal.tsx`](src/components/ClassroomsModal.tsx) + `?joinCode=` auto-enrollment in [`src/app/workspace/page.tsx`](src/app/workspace/page.tsx).

