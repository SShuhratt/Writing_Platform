# Production Refactoring & Readiness Plan (`IELTS Mentor AI` — Standalone)

> **Scope:** Independent B2C & B2B IELTS Writing SaaS (`Writing_Platform`), audited from a Product Manager, Security, Persistence, Monetization, and Real-User UX perspective. ConvoMate bridging is intentionally out of scope.
>
> **Current Readiness Verdict:** ~65–70% production-ready (viable for controlled pilot/closed beta on Turso; **not ready for unattended public paid launch** until Phase 0 and Phase 1 blockers are resolved).

---

## Executive Release Gates

| Gate | Purpose | Mandatory Phases | Go / No-Go Criteria |
| :--- | :--- | :--- | :--- |
| **Gate A: Open Beta** | Safe for public signups on Free & Voucher tiers without data loss or abuse | **Phase 0** | Zero Supabase UUID/FK/RLS persistence errors, zero unauthenticated AI/cohort endpoints, no quota loss on Gemini errors, clean logout & cross-device history sync |
| **Gate B: Paid Public Launch** | Safe for paid B2C P2P/gateway billing & B2B school cohorts at multi-instance scale | **Phase 0 + Phase 1** | Atomic SQL quota/voucher transactions, no warm-Lambda stale cache reads, plan upgrades extend cleanly, accurate single-currency revenue ledger, zero mock Admin metrics |
| **Gate C: General Availability (GA)** | Full commercial polish, self-serve recovery, legal compliance & regression CI | **Phase 0–3** | Working email reset/verification, workspace safety confirmations, Unicode TRF PDF export, legal terms covering P2P/quotas, CSP headers, Vitest + Playwright suite passing |

---

## Phase 0 (P0 Blockers): Security Boundaries, Auth Integrity & Data Loss Prevention

### 0.1 Align Persistence Schema, Foreign Keys, RLS & Fail-Closed Supabase Client
**Observed Issues:**
- `supabase/schema.sql` defines `public.submissions.id` (L76) and `public.reports.id` (L105) as `uuid`, plus `public.submissions.prompt_id` (L78) as an FK referencing `public.prompts(id)`, while `src/lib/submission-repository.ts` (L114) generates string IDs `sub-${Date.now()}-...`, `src/app/api/evaluation/route.ts` (L375) generates `report-${Date.now()}-...`, and `src/lib/prompts-database.ts` contains `160` in-code prompts that may not be seeded into `public.prompts`.
- Tables added for B2B and billing (`cohorts`, `cohort_memberships`, `cohort_assignments`, `cohort_submissions`, `teachers`, `student_accounts`, `user_entitlements`, `billing_orders`, `promo_vouchers`, `voucher_redemptions`, `daily_quotas`, `supabase/schema.sql` L134–283) do not have `enable row level security` enabled.
- `src/lib/supabase.ts` (`getServiceSupabase`, L45) falls back to `supabaseAnonKey` if `SUPABASE_SERVICE_ROLE_KEY` is unset (`const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;`), allowing silent degraded writes/reads with anon permissions instead of failing fast in production.

**Modifications Required:**
1. **`supabase/schema.sql` & Migration SQL:**
   - Migrate `public.submissions.id`, `public.reports.id`, and `public.reports.submission_id` from `uuid` to `text` (or consistently store canonical string IDs / pure UUIDs everywhere — changing columns + dropping/recreating FK cleanly supports existing `sub-*` / `report-*` format and Turso parity).
   - Remove the strict FK on `public.submissions.prompt_id` (store `prompt_id text` as an indexed attribute rather than a blocking foreign key) OR add an idempotent startup/CLI seed script syncing all `160` prompts from `src/lib/prompts-database.ts` into `public.prompts` (removing the FK is safer against future custom/teacher-created prompts).
   - Enable Row Level Security (`alter table ... enable row level security;`) across all sensitive tables (`cohorts`, `cohort_memberships`, `cohort_assignments`, `cohort_submissions`, `teachers`, `student_accounts`, `user_entitlements`, `billing_orders`, `promo_vouchers`, `voucher_redemptions`, `daily_quotas`) with no permissive public `anon` policies so only `service_role` backend routes access them.
2. **`src/lib/supabase.ts`:**
   - Update `getServiceSupabase()` so when `SUPABASE_SERVICE_ROLE_KEY` is missing:
     - Return `null` (or throw explicitly on server writes when `NEXT_PUBLIC_SUPABASE_URL` is set) rather than silently downgrading to `supabaseAnonKey` — preventing partial RLS failures or accidental client-key misuse.
3. **`src/app/api/evaluation/route.ts` (`persistReportSafely`, L25–49):**
   - Remove the `Promise.race` `1500ms` timeout wrapper (`new Promise<void>((resolve) => setTimeout(resolve, 1500))`) so report persistence completes deterministically before returning the report ID. If persistence fails across Turso/Supabase, log structured error telemetry and signal `persisted: false` in the JSON metadata instead of silently returning a `/report/[id]` link that 404s on refresh.

---

### 0.2 Lock Down Unauthenticated APIs, Spoofable Identity & Data Leaks
**Observed Issues:**
- `src/app/api/evaluation/route.ts` (L106–113): `const authUser = verifyAuthenticatedRequest(req); const resolvedUserId = authUser?.userId || bodyData?.userId;` — accepts unauthenticated requests and trusts client-supplied `bodyData.userId`.
- `src/app/api/guidance/route.ts` (L14): Protected only by IP rate limit (`checkRateLimitAsync`, `limit: 30`, `prefix: 'guidance'`) with no `verifyAuthenticatedRequest(req)` check and no per-user daily Socratic cap, leaving Gemini API spend open to script/proxy abuse.
- `src/app/api/cohorts/route.ts` (`GET /api/cohorts?scope=student&studentId=...&studentEmail=...`) and `src/app/api/cohorts/join/route.ts` (`POST /api/cohorts/join`) do not enforce `verifyAuthenticatedRequest(req)`, allowing caller spoofing of another student's `studentId` or `studentEmail`.
- `src/lib/b2b-repository.ts` (`listStudentCohorts`, L789–791): contains `(s.studentId === cleanStudentId || !cleanStudentId)`, which returns cohort data across students when `cleanStudentId` is empty.
- `src/lib/b2b-repository.ts` (`authenticateOrRegisterTeacher`, L234–311): reads/writes in-memory and Turso `teachers` only, skipping the Supabase `teachers` table present in `supabase/schema.sql`.

**Modifications Required:**
1. **`src/app/api/evaluation/route.ts`:**
   - Require valid `verifyAuthenticatedRequest(req)` (student, teacher, or admin token) before running quota checks or AI calls; return `401 Unauthorized` when missing/invalid (unless an explicit rate-limited single-trial guest demo flag is intentionally enabled server-side via signed session cookie).
   - Never trust `bodyData.userId` — derive `resolvedUserId` exclusively from `authUser.userId`.
2. **`src/app/api/guidance/route.ts`:**
   - Enforce `verifyAuthenticatedRequest(req)` and return `401` on unauthenticated calls.
   - Add a per-user daily Socratic guidance quota check in `quota-service` / `billing-repository` (e.g., Free: `25–30/day`, Pro: `120–150/day`) in addition to burst rate limiting (`limit: 30`) to cap Gemini token spend.
3. **`src/app/api/cohorts/route.ts` & `src/app/api/cohorts/join/route.ts`:**
   - Require `verifyAuthenticatedRequest(req)` on both `GET /api/cohorts?scope=student` and `POST /api/cohorts/join`.
   - Derive `studentId`, `studentEmail`, and `studentName` strictly from the verified token/account record rather than query string or JSON body fields.
4. **`src/lib/b2b-repository.ts`:**
   - Remove the `|| !cleanStudentId` fallback in `listStudentCohorts` (fail closed by returning `[]` if `cleanStudentId` is empty).
   - Add full Supabase `teachers` parity inside `authenticateOrRegisterTeacher` (following the same dual-store Turso/Supabase pattern used by `account-repository.ts`).

---

### 0.3 Fix Quota-Before-AI Consumption, Mock Evaluation Fallbacks & Gemini Model List
**Observed Issues:**
- `src/app/api/evaluation/route.ts` checks and consumes evaluation quota (`checkAndRecordEvaluationQuota`) **before** the Gemini generation loop runs.
- `candidateModels` (L147–152) includes `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']` (deprecated `1.5-*` models waste retry latency on 404/unsupported failures).
- If Gemini fails or times out, `src/app/api/evaluation/route.ts` (L340–354, L397–413) invokes `createAndPersistMockReport`, spending the student's daily evaluation credit and persisting a deterministic fallback mock score (`generateMockSubmissionEvaluation`) as if it were real AI grading.

**Modifications Required:**
1. **`src/app/api/evaluation/route.ts` (2-Phase Quota Check-Then-Consume):**
   - Step 1 (Pre-flight): Call read-only `checkEvaluationQuota(req, resolvedUserId, role)` **without incrementing `used_count`**. Return `429` + upgrade payload immediately if exhausted.
   - Step 2 (AI Execution): Update `candidateModels` to active supported models (e.g. `['gemini-2.5-flash', 'gemini-2.0-flash']` configurable via env override `GEMINI_EVALUATION_MODELS`) with bounded per-attempt timeout (`AbortSignal.timeout`) so 4 models cannot exceed serverless function execution limits.
   - Step 3 (Conditional Consume): Increment `daily_quotas.used_count` **only after** a genuine Gemini response passes `zod` schema validation.
   - Step 4 (Failure Handling): On genuine Gemini/network outage in production, return a clear `503 Service Unavailable` (`AI_TEMPORARILY_UNAVAILABLE`) message telling the user **no daily evaluation credit was consumed**, rather than saving and charging for a fake mock band score. Restrict automatic mock fallback strictly to explicit dev/test mode (`ALLOW_MOCK_EVALUATION=true`).

---

### 0.4 Fix Logout Data Leak, Token Isolation, Production Secret & Rate-Limit Consistency
**Observed Issues:**
- `src/lib/auth-service.ts` (`clearUser`, L28–34) only clears `localStorage` and never calls a backend logout route to expire `HttpOnly` cookies.
- `src/lib/store.ts` (`logout`, L202–213) does not reset `history`, `essayText`, or `activeReport` — leaving user A's essays and graded reports visible in Zustand / `localStorage` if user B signs in on a shared/school/cafe PC.
- `src/lib/auth-service.ts` (`getSessionToken`, L88–90) returns `this.getTeacherToken() || this.getAdminToken() || this.getUserToken()`. If a teacher/admin token was previously stored in the same browser, it overrides a signed-in student's token during billing/evaluation requests.
- `src/lib/submission-repository.ts` (`fetchUserSubmissions`, L288) queries Turso only and has zero callers across `src/`, so student submission history does not sync across browsers/devices.
- `src/lib/server-auth.ts` (L3–6) falls back to hardcoded `'ielts-secure-admin-session-hmac-salt-key-2026'` when `ADMIN_SECRET` is missing; `src/components/auth/AuthModals.tsx` (L45) embeds a hardcoded fallback Google Client ID; `src/app/api/auth/*.ts` use synchronous `checkRateLimit` rather than Upstash-backed `checkRateLimitAsync`.

**Modifications Required:**
1. **Add `POST /api/auth/logout` (`src/app/api/auth/logout/route.ts`):**
   - Expire/clear all session cookies (`HttpOnly`, `Path=/`, `Max-Age=0`) on sign-out.
2. **Update `src/lib/auth-service.ts` & `src/lib/store.ts`:**
   - Have `AuthService.clearUser()` (and teacher/admin logout helpers) call `POST /api/auth/logout` (`keepalive: true` or `await fetch(...)`) cleanly.
   - Update `useAppStore.getState().logout()` to explicitly clear user-scoped state: `essayText: ''`, `history: []`, `activeReport: null`, active cohort/assignment selection, and draft buffers.
   - Replace blind precedence in `getSessionToken()` with context-aware getters (`getStudentOrActiveToken()`, `getTeacherToken()`, `getAdminToken()`), and clear conflicting role tokens or require an explicit role flag per API client call (`/api/evaluation`, `/api/billing/*`, `/api/cohorts*` with `scope=student` vs `scope=teacher`, `/api/admin/*`).
3. **Cross-Device Submission History (`src/app/api/submissions/route.ts` + `src/lib/submission-repository.ts` + `src/lib/store.ts`):**
   - Implement `GET /api/submissions` protected by `verifyAuthenticatedRequest(req)` returning paginated history for `authUser.userId`.
   - Update `fetchUserSubmissions(userId)` in `src/lib/submission-repository.ts` to support Supabase (`public.submissions` joined with `public.reports`) in addition to Turso.
   - Hydrate `useAppStore.history` from `GET /api/submissions` on login / workspace boot (merging/deduping by report `id`).
4. **Fail Closed on Production Secrets & Async Rate Limiting:**
   - In `src/lib/server-auth.ts`, throw an explicit server startup/signing error if `process.env.NODE_ENV === 'production'` and `ADMIN_SECRET` is unset (retain dev fallback strictly for `NODE_ENV !== 'production'`).
   - In `src/components/auth/AuthModals.tsx` (and `/api/auth/google/route.ts`), remove the hardcoded Google Client ID fallback literal; rely solely on `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` and hide the Google button cleanly when unconfigured.
   - Switch auth endpoints (`src/app/api/auth/login/route.ts`, `register/route.ts`, `google/route.ts`, `teacher/route.ts`) and cohort/prompt mutations to `checkRateLimitAsync` so brute-force limits hold across Vercel Serverless instances.

---

## Phase 1 (P0–P1): Billing Atomicity, Voucher Integrity & Admin Ops

### 1.1 Atomic SQL Quota & Voucher Redemptions + Eliminate Stale Warm-Lambda Caches
**Observed Issues:**
- `src/lib/billing-repository.ts` (`consumeDailyEvaluationQuota`, L536–580) uses non-atomic read-then-write increments, allowing concurrent tabs/requests to bypass `dailyLimit` (`2/day` Free, `20/day` Pro).
- Voucher redemption in `billing-repository.ts` can exceed `max_uses` or double-redeem under simultaneous POST `/api/billing/redeem` calls.
- In-memory caches (`store.vouchers`, `store.orders`, etc. inside `billing-repository.ts`) short-circuit DB reads inside long-lived warm serverless Lambdas, causing stale balances/vouchers across multiple Vercel instances.

**Modifications Required:**
1. **`supabase/schema.sql` & `src/lib/billing-repository.ts`:**
   - Replace read-then-write quota consumption with atomic SQL statements:
     - **Turso (SQLite):** `INSERT INTO daily_quotas (quota_key, window_date, used_count, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT(quota_key, window_date) DO NOTHING;` followed by `UPDATE daily_quotas SET used_count = used_count + 1, updated_at = ? WHERE quota_key = ? AND window_date = ? AND used_count < ?;` verifying `rowsAffected === 1`.
     - **Supabase (PostgreSQL):** Create a `SECURITY DEFINER` RPC `consume_daily_quota(p_quota_key text, p_window_date text, p_limit int)` and `redeem_promo_voucher(...)` executing conditional `UPDATE ... WHERE used_count < max_uses` and unique constraint insert into `voucher_redemptions` atomically inside one DB transaction.
   - Remove cross-request in-memory short-circuit reads in `billing-repository.ts` whenever Turso or Supabase is configured (retain in-memory `Map` fallback strictly when *neither* database is configured in local-only mode).

---

### 1.2 Plan Upgrade / Entitlement Stacking & P2P Checkout Safeguards
**Observed Issues:**
- `src/lib/billing-repository.ts` (`grantUserEntitlement`, L585–619) extends existing entitlements only when `e.provider === params.provider && e.planCode === params.planCode`. Upgrading from `PRO_MONTHLY` to `PRO_QUARTERLY` (or stacking a promo voucher on a paid plan) creates overlapping parallel entitlements, wasting remaining Pro days.
- `BILLING_P2P_CARD_NUMBER` defaults to `'8600 •••• •••• 0000 (Configure BILLING_P2P_CARD_NUMBER)'` (L123) and is still displayed as copyable card text in `UpgradePlanModal.tsx`.
- `UpgradePlanModal.tsx` allows a user to submit unlimited duplicate pending P2P orders without blocking or warning.

**Modifications Required:**
1. **Unified Entitlement Extension (`grantUserEntitlement` in `src/lib/billing-repository.ts`):**
   - When granting any paid Pro tier (`PRO_MONTHLY`, `PRO_QUARTERLY`, `SCHOOL_SEAT`) or Pro promo voucher:
     - Anchor `startsAt` or `expiresAt` to `Math.max(nowMs, latestActivePaidEntitlementExpiresAt)` so remaining paid Pro days roll forward cleanly when upgrading/extending, and supersede/close the replaced entitlement record cleanly (`status = 'superseded'` or unified expiry).
2. **P2P Configuration Guard & Duplicate Pending Order Prevention (`billing-repository.ts`, `/api/billing/orders/route.ts`, `UpgradePlanModal.tsx`):**
   - Expose a boolean `p2pConfigured` (true only when `BILLING_P2P_CARD_NUMBER` is explicitly set and does not contain placeholder text) from `GET /api/billing/status` / checkout config.
   - In `UpgradePlanModal.tsx`, if `!p2pConfigured`, disable the P2P card transfer submit flow and show a clear `"Manual transfer temporarily unavailable — use voucher or contact support"` notice rather than displaying dummy digits.
   - Enforce a guard (`existingPendingOrder` check) in `createBillingOrder`: allow at most `1` open `'pending'` order per user+plan (or return the existing pending order + let the user update its transfer reference / receipt rather than spamming duplicate admin rows).

---

### 1.3 Single-Currency Ledger Accuracy, Unbounded Admin Aggregation & Lifecycle Actions
**Observed Issues:**
- `src/lib/billing-repository.ts` (`createBillingOrder`, L804–834; `getAdminBillingOverview`, L1120–1194): stores both `amountUzs` and `amountUsd` on every order regardless of which currency the student paid, and `getAdminBillingOverview` caps queries at `LIMIT 50` while summing both `amountUzs` and `amountUsd` simultaneously (creating double-counted revenue totals).
- Admin billing UI (`src/app/admin/page.tsx` + `/api/admin/billing/route.ts`) lacks lifecycle controls to deactivate/reactivate vouchers, inspect full order history beyond 50 rows, or revoke/refund mistakenly approved entitlements.

**Modifications Required:**
1. **Currency-Explicit Orders (`supabase/schema.sql` + `src/lib/billing-repository.ts`):**
   - Add `currency text` (`'UZS'` | `'USD'`) and `amount_paid numeric` (or populate only the chosen currency column and record explicit `currency` in `billing_orders`), collecting currency explicitly in `UpgradePlanModal.tsx` (`UZS Card Transfer` vs. `USD International`).
   - Aggregate Admin revenue strictly grouped by actual `currency` (`totalApprovedUzs` from UZS-paid orders only, `totalApprovedUsd` from USD-paid orders only) using SQL `SUM` / `COUNT` queries with **no `LIMIT 50` truncation**.
2. **Admin Pagination & Lifecycle Controls (`/api/admin/billing/route.ts` & `/admin`):**
   - Add `page` / `status` query filters for orders and vouchers in `GET /api/admin/billing`.
   - Add `PATCH` actions in `/api/admin/billing`: `toggle_voucher` (`is_active`), `revoke_entitlement` / `refund_order` (updating order status `'refunded'` / `'revoked'` and marking associated `user_entitlements.status = 'revoked'`).

---

### 1.4 Eliminate Mock Admin Analytics & Fake AI Token Counts
**Observed Issues:**
- `src/app/admin/page.tsx` + `src/lib/admin-service.ts` initialize dashboard cards with hardcoded mock data (`1428` submissions, `"Alex Smith"`) before live fetches resolve or when unauthenticated/errored.
- `src/lib/submission-repository.ts` (`fetchLiveAdminAnalytics`, L329–412) queries Turso only (ignoring Supabase) and fabricates `activeSessions: Math.max(1, Math.round(total * 0.05))` and `aiApiTokenCount: total * 1850`.

**Modifications Required:**
1. **`src/app/admin/page.tsx` & `src/lib/admin-service.ts`:**
   - Replace mock `"Alex Smith"` / `1428` defaults with honest loading skeletons / empty states and an explicit error banner when `/api/admin/analytics` fails.
2. **`src/app/api/evaluation/route.ts`, `supabase/schema.sql`, `src/lib/submission-repository.ts`:**
   - Capture real `response.usageMetadata` (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) from Gemini on every evaluation and persist `ai_tokens_used` on `reports` / `submissions` (and aggregate Guidance API usage optionally in a lightweight telemetry counter).
   - Update `fetchLiveAdminAnalytics()` to query both Turso and Supabase, compute real active users (distinct users active in the last 24h/7d from real DB timestamps), and return actual summed `ai_tokens_used` (labeling estimates as `"N/A (legacy)"` only for pre-migration rows).

---

### 1.5 Automated Notifications, Receipt Verification & Automated Payment Gateways
**Observed Issues:**
- When a student submits a P2P order (`POST /api/billing/orders`), no email or Telegram alert notifies the admin; when the admin approves/rejects an order (`PATCH /api/admin/billing`), the student is not automatically notified and must manually click refresh.
- Manual card transfer lacks optional receipt proof upload (making P2P reconciliation fragile as order volume grows).

**Modifications Required:**
1. **Ops Webhook & Receipt Proof (`POST /api/billing/orders` + `UpgradePlanModal.tsx`):**
   - Fire an optional non-blocking Telegram Bot webhook (`TELEGRAM_ADMIN_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID`) on new pending P2P orders with user email, plan, currency/amount, transfer note, and direct link to `/admin`.
   - Allow optional receipt upload (constrained JPEG/PNG/WebP `<= 2 MB` stored in Supabase Storage private bucket or validated signed reference) attached to `billing_orders.receipt_url`, viewable in `/admin` review modal.
   - Poll `GET /api/billing/status` every `15s` while `UpgradePlanModal` shows a `'pending'` order (and on window focus) so admin approval reflects automatically in the student's UI without manual reload; optionally send confirmation email when Resend/SMTP is configured.
2. **Gateway Webhook Milestone (Payme / Click / Lemon Squeezy):**
   - Implement clean `PaymentProviderAdapter` webhook endpoints (`/api/webhooks/click`, `/api/webhooks/payme`, `/api/webhooks/lemonsqueezy`) using signature verification + idempotent `external_payment_id` mapping to `billing_orders` and `grantUserEntitlement`, allowing P2P and instant automated checkout to coexist side-by-side.

---

## Phase 2 (P1): Account Recovery, Session Lifecycle & Real-User UX Polish

### 2.1 Real Email Verification, Password Reset & Google/Local Account Linking
**Observed Issues:**
- `src/lib/auth-service.ts` (`resetPassword(email)`, L231–236) is a static UI stub returning a placeholder success string without sending an email or changing any password.
- No email verification exists on `/api/auth/register`.
- Users registering with local email/password and later signing in via Google OAuth (or vice versa) need deterministic account linking without silently locking out credentials or exposing unverified emails.

**Modifications Required:**
1. **Transactional Email Provider & DB Reset Tokens:**
   - Add `password_reset_tokens` / `email_verification_tokens` table (storing `SHA-256` hashed short-lived tokens, `15–60 min` expiry, `used_at`) in Turso + `supabase/schema.sql`.
   - Wire Resend/Nodemailer (`RESEND_API_KEY` or `SMTP_*`) via `src/lib/email-service.ts`.
   - Implement `POST /api/auth/forgot-password` (always returning uniform neutral 200 messaging to avoid email enumeration), `POST /api/auth/reset-password` (verifying token hash, updating salted password hash), and `POST /api/auth/verify-email`.
   - Update `AuthService.resetPassword()` and `AuthModals.tsx` to execute the real request + show clear reset token submission UI.
2. **Google ↔ Local Account Linking (`src/app/api/auth/google/route.ts` & `src/app/api/auth/login/route.ts`):**
   - If a verified Google login matches an existing local verified email, mark email verified / attach `google_sub` cleanly; if a Google-only account tries local password login, display an actionable prompt (`"This account uses Google Sign-In — continue with Google or use Forgot Password to set a local password"`).

---

### 2.2 24h Session Expiry Detection & Graceful Re-Authentication
**Observed Issues:**
- `src/lib/server-auth.ts` issues tokens with default `expiresInMs = 24 * 60 * 60 * 1000` (L30), while `localStorage` in `AuthService` retains user profile UI state indefinitely, causing students to think they are signed in until a `401` fails during essay submission.

**Modifications Required:**
1. **Add `GET /api/auth/me` (`src/app/api/auth/me/route.ts`):**
   - Validates `verifyAuthenticatedRequest(req)` on app mount and returns fresh profile + active plan/quota state or `401`.
2. **Client Expiry Interceptor (`src/lib/auth-service.ts` & `src/app/workspace/page.tsx`):**
   - Any API `401` on `/api/auth/me`, `/api/billing/status`, or `/api/evaluation` triggers graceful session clearing (preserving the active draft temporarily in an isolated unsubmitted recovery key for the current browser tab, rather than losing their typed essay) and prompts re-login via `AuthModals`.

---

### 2.3 Writing Workspace Safety Rails & Live Coaching UX
**Observed Issues:**
- `src/lib/store.ts` (`setPrompt`, L218–228) wipes `essayText: ''` immediately on prompt selection with zero confirmation, and stores only one global `essayText` (navigating via `?promptId=` or switching Task 1 ↔ Task 2 silently destroys written work).
- `src/components/EditorSurface.tsx` (L550) enables Submit Evaluation at `wordCount > 0`; a student accidentally clicking Submit at 10–30 words wastes one of their 2 daily Free evaluations and triggers an unfair low-word Band score.
- `EditorSurface.tsx` (`handlePaste` & `handleDrop`, L151–159) blocks all paste operations—including internal cut-and-paste when students try to move/reorder their own paragraphs inside the editor.
- `EditorSurface.tsx` Live Guidance Triggers 1–5 (L252–295) lack a minimum cooldown or `AbortController` between in-flight requests, and L278 (`!== currentParagraphs`) misfires whenever a blank line is added/removed; L461 repeats identical `bg-blue-950` classes, and the timer runs continuously even while modals are open or stays unreset after submission.
- `src/lib/billing-repository.ts` (`getQuotaWindowMetrics`, L129–138) resets strictly at UTC midnight, but `QuotaExceededModal.tsx` does not display the user's local reset wall-clock time.

**Modifications Required:**
1. **Per-Prompt Draft Store & Switch Confirmation (`src/lib/store.ts`, `PromptSelectorModal.tsx`, `src/app/workspace/page.tsx`):**
   - Store drafts keyed by `draftsByPromptId: Record<string, string>` (keyed additionally by `userId` namespace so cross-user privacy holds) instead of one destructive global `essayText`.
   - Prompt the user with a confirmation dialog before replacing/discarding non-empty text or switching prompts via UI/URL query parameter (`?promptId=`), keeping an automatic local snapshot of previous text.
2. **Low-Word-Count Evaluation Guard (`EditorSurface.tsx`):**
   - Below `50` words (while `wordCount > 0`), clicking **Submit for Evaluation** opens an inline confirmation warning (`"You have only N words. IELTS minimum is 150 (Task 1) / 250 (Task 2). Evaluating now consumes 1 daily credit. Continue?"`) instead of firing `/api/evaluation` immediately.
3. **Internal Paragraph Reordering Clipboard (`EditorSurface.tsx`):**
   - Maintain a short-lived internal clipboard marker (`onCopy` / `onCut` inside the editor `<textarea>` records a normalized fingerprint of the copied/cut slice; `handlePaste` allows pasting when `clipboardData.getData('text/plain')` exactly matches the internal editor slice while still blocking external pasted essays/AI drafts and displaying a helpful tooltip).
4. **Socratic Trigger Debounce, Cancellation & UI Fixes (`EditorSurface.tsx` & `SocraticSidePanel.tsx`):**
   - Add an `AbortController` per live guidance request in `generateRealtimeGuidance` so superseded calls cancel cleanly.
   - Add a `>= 12–15s` cooldown between automated triggers, ignore pure whitespace/empty newline count changes on paragraph boundaries (`nonEmptyParagraphs.length`), fix the duplicate `bg-blue-950` styling bug on L461, and adjust the progress bar color visually once target word counts (`150` / `250`) are reached.
   - Pause the writing timer automatically when `document.hidden` is true or a modal (`PromptSelectorModal`, `UpgradePlanModal`, `DualLayerReportModal`) is open, and offer explicit reset/completion on submission.
5. **Local Timezone Reset Display (`QuotaExceededModal.tsx` & `UpgradePlanModal.tsx`):**
   - Format `resetsAt` ISO timestamp using `Intl.DateTimeFormat` into the user's browser timezone alongside UTC (`Resets in Xh Ym (at HH:MM your local time)`).

---

### 2.4 TRF PDF Unicode Font Support & Task 1 Visual Illustration Honesty
**Observed Issues:**
- `src/lib/pdf-service.ts` relies on built-in `'helvetica'` PDF font, which corrupts or strips non-ASCII characters (Uzbek diacritics `oʻ`/`gʻ`, Cyrillic names, smart quotes, em-dashes) on downloadable TRF certificates.
- `src/components/Task1VisualIllustration.tsx` handles 8 explicit `promptId` cases and falls back to 5 generic reusable SVGs (`Water Usage`, etc.), risking displaying an unrelated chart next to an Academic Task 1 prompt whose `promptId` isn't explicitly mapped.

**Modifications Required:**
1. **`src/lib/pdf-service.ts`:**
   - Bundle/register a lightweight Unicode TTF subset (`NotoSans-Regular` / `NotoSans-Bold` via base64/asset loader in `jspdf`) and normalize/fallback cleanly so student names, Uzbek/Cyrillic characters, and quotes render accurately.
2. **`src/components/Task1VisualIllustration.tsx`:**
   - Map/tag prompts cleanly using explicit visual specs on each Task 1 Academic prompt entry (`src/lib/prompts-database.ts`) or replace unmatched fallback SVGs with a clean **Custom Visual Brief** notice (`"Use the chart/diagram specification described in the prompt card above — illustrative generic preview omitted to avoid mismatch"`).

---

## Phase 3 (P1–P2): Conversion, Legal Compliance, Security & Automated Testing

### 3.1 Landing Page Pricing, Free/Pro Transparency & Funnel Alignment
**Observed Issues:**
- The public landing page (`/` + `Navbar.tsx`) lacks a pricing & tier breakdown section, forcing prospective B2C learners and B2B academy leads to discover limits (`2/day` Free vs. `20/day` Pro vs. Academy `SCHOOL_SEAT`) only after hitting a paywall or opening `/workspace`.

**Modifications Required:**
1. **`src/components/landing/` & `src/app/page.tsx` & `Navbar.tsx`:**
   - Add a **Pricing & Plans** section (`Free Forever — 2 AI evaluations/day`, `Pro Monthly — 49,000 UZS / $9`, `Pro Quarterly — 119,000 UZS / $22`, `School / Academy Cohorts — 25,000 UZS / seat`) dynamically synced with plan constants from `billing-repository` / public pricing config.
   - Add `Pricing` anchor link & `Upgrade` trigger in landing `Navbar.tsx` + dedicated CTA card for academy directors routing cleanly to `/teacher`.

---

### 3.2 Canonical Domain Unification, Real Support Contact & Legal Terms Update
**Observed Issues:**
- Domain mismatch exists across files: `src/lib/pdf-service.ts` sets `DEFAULT_APP_ORIGIN = 'https://writing-platform-git-main-sshuhratts-projects.vercel.app'`, whereas `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` reference `'https://writing-platform-two.vercel.app'` and `support@ieltsmentor.ai`.
- `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` do not yet cover paid Pro subscriptions, P2P card transfer verification SLAs, digital credit non-transferability / refund rules, or daily fair-use quota limits.

**Modifications Required:**
1. **Single Canonical Origin (`src/lib/site-config.ts` / `NEXT_PUBLIC_SITE_URL`):**
   - Replace hardcoded Vercel preview/branch URLs in `pdf-service.ts`, `privacy/page.tsx`, `terms/page.tsx`, `layout.tsx`, and OG/canonical metadata with `process.env.NEXT_PUBLIC_SITE_URL` falling back to one canonical production URL (custom domain or single finalized Vercel domain).
2. **Real Support Channels & Paid Terms (`privacy/page.tsx` & `terms/page.tsx`):**
   - Replace placeholder/unmonitored contact copy with verified `SUPPORT_EMAIL` / Telegram support handle (`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_TELEGRAM`).
   - Add explicit clauses in `/terms` for:
     - Free (`2/day`) and Pro (`20/day`) rolling UTC quotas and AI availability disclaimer (no quota deducted on verified AI outage).
     - Manual P2P verification SLA, duplicate-order rules, promo voucher expiry/single-redemption policy, and 7-day unused refund / dispute workflow.
     - Teacher/academy cohort data visibility disclosure in `/privacy` (explicit notice that submissions to a teacher's cohort classroom are visible to that cohort's teacher).

---

### 3.3 Security Headers, Structured Observability & Automated Test Suite
**Observed Issues:**
- `next.config.mjs` does not include a `Content-Security-Policy` header alongside existing security headers.
- `package.json` contains no automated unit, API integration, or browser E2E test suite (`jest`, `vitest`, or `playwright`).

**Modifications Required:**
1. **`next.config.mjs`:**
   - Add an explicit `Content-Security-Policy` header permitting self, Gemini/Google Sign-In scripts & frames (when OAuth enabled), Supabase/Turso/Upstash backend connections only from server routes, inline styles/fonts needed by Next.js/Tailwind, and `frame-ancestors 'none'`.
2. **Structured Error Telemetry:**
   - Introduce lightweight error/audit logging (`Sentry` or structured JSON logging on `500`/DB fallback/`evaluation` parse failures) including request IDs and user/route context without logging raw essay PII in server logs unless consented.
3. **Automated Test Suite (`package.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/`):**
   - Add `vitest` unit + API route integration tests covering:
     - `server-auth.ts`: HMAC signing/tampering rejection, prod missing-secret fail-closed check, expiration check.
     - `billing-repository.ts`: Concurrent `consumeDailyEvaluationQuota` race safety, concurrent `redeemPromoVoucher` single-use lock, entitlement extension/upgrade stacking (`PRO_MONTHLY` -> `PRO_QUARTERLY`), single-currency admin revenue sum accuracy.
     - `b2b-repository.ts`: `listStudentCohorts` empty ID fail-closed guard, unauthorized student cross-cohort isolation, teacher registration Turso+Supabase parity.
     - `evaluation/route.ts`: `401` on unauthenticated calls, `429` without quota increment when exhausted, **no quota consumption** when mocked Gemini throws `503`, `200` quota consumption + report persistence only on valid `zod` response.
   - Add `playwright` smoke E2E covering:
     - Register -> draft safety confirmation on prompt switch -> `< 50` word confirmation -> evaluation report persistence + `/report/[id]` reload -> P2P order submit -> `/admin` approval -> Pro quota reflected in `/workspace`.
   - Expose `"test": "vitest run"`, `"test:watch": "vitest"`, and `"test:e2e": "playwright test"` in `package.json`.

---

## Non-Destructive Database Migration Strategy

Run these additive/corrective steps cleanly before deploying Phase 0/1 code to production:

1. **Backup Current State:** Export snapshots of Supabase tables and Turso `.db` rows before applying DDL changes.
2. **Supabase PostgreSQL Migration (`supabase/migrations/001_production_hardening.sql`):**
   - Alter `public.reports` and `public.submissions` ID/FK columns from `uuid` to `text` cleanly (drop FK on `reports.submission_id`, alter types with `USING ...::text`, drop FK on `submissions.prompt_id`, re-add `reports.submission_id -> submissions.id` `text` FK with `ON DELETE CASCADE`).
   - Add columns: `reports.ai_tokens_used integer default 0`, `billing_orders.currency text default 'UZS'`, `billing_orders.amount_paid numeric default 0`, `billing_orders.receipt_url text`.
   - Add table `password_reset_tokens` & `email_verification_tokens`.
   - Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on `cohorts`, `cohort_memberships`, `cohort_assignments`, `cohort_submissions`, `teachers`, `student_accounts`, `user_entitlements`, `billing_orders`, `promo_vouchers`, `voucher_redemptions`, `daily_quotas`, `password_reset_tokens`, `email_verification_tokens`.
   - Create atomic RPC functions: `consume_daily_quota` and `redeem_promo_voucher`.
3. **Turso / LibSQL Startup Schema Migration:**
   - Ensure `ALTER TABLE` (guarded idempotently via `PRAGMA table_info`) adds `ai_tokens_used`, `currency`, `amount_paid`, `receipt_url`, and creates `password_reset_tokens` / `email_verification_tokens` without breaking existing rows.

---

## File-by-File Modification Matrix

| Area | File Path | Planned Changes | Phase |
| :--- | :--- | :--- | :--- |
| Schema & RPC | `supabase/schema.sql` (+ migration SQL) | Convert `submissions`/`reports` IDs to `text`, drop `prompt_id` FK, enable RLS on all private tables, add `ai_tokens_used`/`currency`/`receipt_url`/reset tokens, add atomic SQL RPCs | P0, P1 |
| Supabase Client | `src/lib/supabase.ts` | Stop `getServiceSupabase()` fallback to `supabaseAnonKey` | P0 |
| Submission Repo | `src/lib/submission-repository.ts` | Support Supabase in `fetchUserSubmissions` & `fetchLiveAdminAnalytics`; drop `0.05`/`total*1850` fake metrics; store real `ai_tokens_used` | P0, P1 |
| Evaluation API | `src/app/api/evaluation/route.ts` | Enforce auth (`401`), ignore client `userId`, check quota before Gemini and consume *after* valid schema pass, update model list, await `persistReportSafely` without `1500ms` race, disallow silent prod mocks | P0, P1 |
| Guidance API | `src/app/api/guidance/route.ts` | Enforce `verifyAuthenticatedRequest`, add per-user daily Socratic limit | P0 |
| B2B APIs & Repo | `src/app/api/cohorts/route.ts`, `cohorts/join/route.ts`, `src/lib/b2b-repository.ts` | Enforce auth on student cohort endpoints, drop `!cleanStudentId` bypass, add Supabase parity to `authenticateOrRegisterTeacher` | P0 |
| Auth APIs & Libs | `src/lib/server-auth.ts`, `src/lib/auth-service.ts`, `src/app/api/auth/*`, `AuthModals.tsx` | Fail closed on `ADMIN_SECRET` in prod, add `/api/auth/logout`, `/api/auth/me`, `/api/submissions`, switch auth routes to `checkRateLimitAsync`, isolate token getters, remove fallback Google Client ID literal, add real email reset/verification | P0, P2 |
| Store | `src/lib/store.ts` | Clear `history`/`essayText`/`activeReport` on `logout()`, hydrate remote history, track per-prompt drafts + switch guard | P0, P2 |
| Billing & Quotas | `src/lib/billing-repository.ts`, `src/lib/quota-service.ts`, `src/app/api/billing/*`, `src/app/api/admin/billing/route.ts` | Atomic quota & voucher SQL, drop stale Lambda cache, extend overlapping Pro entitlements, duplicate pending check, explicit single-currency storage & full SUM aggregation, voucher toggle & refund/revoke actions, Telegram ops alerts | P1 |
| Billing UI | `src/components/UpgradePlanModal.tsx`, `src/components/QuotaExceededModal.tsx` | Disable P2P if card env unconfigured, currency selector, duplicate-order notice, receipt upload, 15s approval polling, local timezone reset time | P1, P2 |
| Workspace UI | `src/components/EditorSurface.tsx`, `src/app/workspace/page.tsx`, `src/components/SocraticSidePanel.tsx` | Prompt switch confirmation, `<50` word confirmation, internal cut/paste buffer, `AbortController` + trigger cooldown, whitespace paragraph fix, timer pause on modals/hidden tab, `bg-blue-950` fix, progress color | P2 |
| Admin UI | `src/app/admin/page.tsx`, `src/lib/admin-service.ts` | Remove fake `"Alex Smith"` / `1428` baseline, wire full paginated billing/voucher controls & receipt inspection | P1 |
| PDF & Visuals | `src/lib/pdf-service.ts`, `src/components/Task1VisualIllustration.tsx` | Embed Unicode NotoSans font subset, unify canonical site URL, replace unrelated Task 1 fallback SVG with clean brief notice | P2, P3 |
| Landing & Legal | `src/app/page.tsx`, `src/components/landing/*`, `Navbar.tsx`, `privacy/page.tsx`, `terms/page.tsx` | Add Pricing & Plan tier cards, unify domain/contact env vars, update Terms & Privacy for paid plans/P2P/refunds/cohort visibility | P3 |
| Security & Tests | `next.config.mjs`, `package.json`, `tests/` | Add CSP headers, install & wire Vitest + Playwright smoke tests | P3 |

---

## Production Environment Variables Checklist

Ensure the following environment variables are explicitly configured before cutover:

- **Required in Production:**
  - `ADMIN_SECRET` (high-entropy 32+ char secret — server throws on boot/sign if absent in prod)
  - `GEMINI_API_KEY`
  - `NEXT_PUBLIC_SITE_URL` (canonical production origin without trailing slash)
  - Primary DB: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` and/or `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (distributed rate limiting)
  - `BILLING_P2P_CARD_NUMBER`, `BILLING_P2P_CARD_HOLDER`, `BILLING_P2P_BANK_NAME` (for manual transfer mode)
- **Required for Full Self-Serve & Ops (Phases 1–2):**
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (if Google Sign-In is enabled)
  - `RESEND_API_KEY` or `SMTP_*` + `EMAIL_FROM` (verification & password reset emails)
  - `TELEGRAM_ADMIN_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` (instant P2P payment alerts)
  - `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_TELEGRAM`

---

## Verification & Rollout Order

1. **Deploy DB Migration first** (`supabase/migrations/001_production_hardening.sql` + verify Turso columns) while codebase changes remain backwards-compatible.
2. **Implement & ship Phase 0** -> verify via TypeScript (`npx tsc --noEmit`), Vitest security/auth/quota-refund integration suite, and manual staging checks:
   - Unauthenticated `POST /api/evaluation`, `POST /api/guidance`, `GET /api/cohorts?scope=student`, `POST /api/cohorts/join` all return `401`.
   - Forced Gemini error returns `503` without incrementing `daily_quotas.used_count`.
   - User A logout -> User B login shows zero stale essays/reports; logging in on incognito reloads past persisted reports from `GET /api/submissions`.
3. **Implement & ship Phase 1** -> run Vitest concurrency/billing tests (parallel quota/voucher calls confirm zero overspend) + verify `/admin` UZS/USD separated totals, voucher toggle, order approval + auto UI upgrade detection.
4. **Implement & ship Phase 2** -> verify password reset flow end-to-end, draft-switch warning, `<50` word confirmation, Cyrillic/Uzbek PDF certificate rendering, and timer behavior.
5. **Implement & ship Phase 3** -> run `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test`, and Playwright E2E smoke tests in CI before opening paid traffic.

