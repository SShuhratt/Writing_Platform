# IELTS Writing Assistant Platform

An official-grade, adaptive IELTS Writing platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Zustand**, **Google Gemini API**, **Turso (LibSQL) / Supabase**, and **jsPDF**.

For detailed architectural notes and the completed Phase 1–4 implementation checklist, see [PRODUCT_REVIEW_AND_ROADMAP.md](./PRODUCT_REVIEW_AND_ROADMAP.md).

## 🌐 Live Production Deployment
- **Live Vercel Application**: [https://writing-platform-git-main-sshuhratts-projects.vercel.app/](https://writing-platform-git-main-sshuhratts-projects.vercel.app/)
- **GitHub Repository**: [https://github.com/SShuhratt/Writing_Platform](https://github.com/SShuhratt/Writing_Platform)

---

## 🔐 Authentication, Roles & Security

- **Student Accounts**: Students can sign up or sign in inside `/workspace` (including optional Google Sign-In via `NEXT_PUBLIC_GOOGLE_CLIENT_ID`). Student accounts include **2 free evaluations per day** resetting at UTC midnight (`quota-service.ts`).
- **B2B Teachers & Language Schools (`/teacher`)**: Instructors register or sign in via `/api/auth/teacher` using per-user salted `scrypt` password hashes (optionally gated by `TEACHER_ACCESS_CODE`). Authenticated sessions receive an HMAC-SHA256 HttpOnly/Bearer token (`ielts_session_token`) with unlimited evaluation quota.
- **Platform Admin (`/admin`)**: Configured server-side via `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Admin tokens are verified server-side across `/api/auth/verify-admin`, `/api/admin/analytics`, `/api/cohorts/**`, and global prompt creation (`POST /api/prompts`).
- **Rate Limiting & Anti-Injection**: Sliding-window rate limiting (`rate-limit.ts`) keys by auth token suffix or `x-client-session` header (falling back to IP) so students behind a shared classroom NAT do not block one another, combined with input sanitization and prompt-injection guardrails (`security-sanitize.ts`).

---

## ⚡ Environment & Database Configuration

Create `.env.local` from the template:
```bash
cp .env.example .env.local
```

Configure server-side and optional database variables in `.env.local`:
```bash
# Google Gemini API key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Platform Admin Credentials (required for /admin, /api/admin/analytics, /api/admin/billing, POST /api/prompts)
ADMIN_USERNAME=your_admin_username
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password_here
ADMIN_SESSION_SECRET=your_random_cryptographic_hmac_secret_here

# Optional B2B Teacher Registration Code, Google OAuth & Deep-Link URL
# TEACHER_ACCESS_CODE=your_school_invite_code
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
# GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Optional Distributed Rate Limiting (Upstash Redis REST) & Standalone P2P Billing Config
# UPSTASH_REDIS_REST_URL=https://your-upstash-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
# BILLING_P2P_CARD_NUMBER=8600000000000000
# BILLING_P2P_CARD_HOLDER=Your Official Account Name
# BILLING_P2P_BANK_NAME=Humo / Uzcard

# Optional Database Persistence: Turso (LibSQL) or Supabase
# TURSO_DATABASE_URL=libsql://your-db.turso.io
# TURSO_AUTH_TOKEN=your_turso_token
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Offline & Fallback Behavior**:
> - When `GEMINI_API_KEY` is configured, `/api/guidance` and `/api/evaluation` try `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash` -> `gemini-1.5-pro`. If `GEMINI_API_KEY` is omitted, the platform uses its built-in deterministic pedagogical examiner and Socratic feedback engine.
> - When Turso/Supabase variables are omitted or unreachable, submissions, shared reports, and B2B cohorts fall back to server in-memory caching. For persistent SQL storage, apply [`supabase/schema.sql`](./supabase/schema.sql) in Supabase or run `npm run db:seed` (`scripts/seed-turso.mjs`) for Turso.

---

## 🚦 Routes & Pages

- **`/`**: Landing Page (Hero, 3D visual presets, Socratic Band 5.0–9.0 overview, 3-step workflow, footer with Teacher Portal access).
- **`/workspace`**: Real-time IELTS Writing Workspace featuring auto-saved drafts/timers (`store.ts`), **Anti-Paste Learning Guard**, debounced Socratic guidance, dynamic Band recalibration offers, Submission History (`SubmissionHistoryModal`), Tiered Daily Quota tracking (`QuotaExceededModal` — `2/day` Free, `20/day` Pro), **Upgrade & Voucher Modal** (`UpgradePlanModal`), and **Classrooms** (`ClassroomsModal` + `?joinCode=` auto-enrollment and `?promptId=` practice deep-links).
- **`/teacher`**: Dedicated **B2B School & Teacher Portal** to manage student cohorts, generate 6-character invite codes/links, seed a 1-click sample B2B class, assign official or custom IELTS tasks (`AssignPromptModal`), inspect student Dual-Layer + inline reports (`CohortSubmissionReviewModal`), and save coaching feedback.
- **`/report/[id]`**: Public shareable IELTS Writing Report page with OpenGraph/Twitter metadata, Layer 1 & Layer 2 assessment tabs (`ReportDetailsTabs`), interactive inline sentence highlights, collapsible essay transcript, PDF download, and one-click `"Practice This Exact Topic Now"` launch into `/workspace`.
- **`/admin`**: Guarded Admin Monitoring & Billing Dashboard powered by real database metrics (`/api/admin/analytics`), band score distribution charts, live submission feed, and **Billing, Orders & Vouchers** (`/api/admin/billing`) for P2P order approvals and multi-use voucher generation.
- **`/privacy`** & **`/terms`**: Platform legal pages.

---

## 🔌 API Endpoints

- `POST /api/guidance` — Generates Socratic writing coaching cards (rate-limited; Gemini or offline pedagogical fallback).
- `POST /api/evaluation` — Performs Dual-Layer IELTS scoring + inline sentence annotations, enforces student daily quotas, persists reports, and links cohort assignment submissions.
- `GET /api/reports/[id]` — Retrieves persisted or cached reports for public `/report/[id]` links and teacher inspection.
- `GET / POST /api/prompts` — Lists official/stored prompts and allows verified admins to persist new prompts.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google` & `GET /api/auth/verify-admin` — Server-backed student registration (`scrypt`), password login, verified Google OAuth, admin auth (using `ADMIN_USERNAME`/`ADMIN_EMAIL` + `ADMIN_PASSWORD`), and signed HMAC `ielts_session_token` / `ielts_admin_token` verification.
- `GET / POST /api/auth/teacher` — Registers/logs in teachers with `scrypt` password hashing and verifies teacher/admin sessions.
- `GET /api/billing/status`, `POST /api/billing/redeem`, `GET / POST /api/billing/orders` — Student tier/quota summary (`FREE` `2/day`, `PRO_MONTHLY` / `PRO_QUARTERLY` / `SCHOOL_SEAT` `20/day`), idempotent promo/school voucher redemption, and P2P card transfer receipt submission.
- `GET / POST / PATCH /api/admin/billing` — Admin billing overview, voucher creation, and P2P order approval/rejection to grant standalone Pro entitlements.
- `GET / POST /api/cohorts`, `POST /api/cohorts/join`, `GET /api/cohorts/[id]`, `POST / DELETE /api/cohorts/[id]/assignments`, `PATCH /api/cohorts/[id]/submissions` — Full B2B cohort, invite enrollment, prompt assignment, and instructor feedback lifecycle.
- `GET /api/admin/analytics` — Aggregates platform KPIs and recent submission activity for `/admin`.
- `GET /api/3d` — Serves preset lighting/material configuration for interactive 3D visuals.

---

## ✨ Key Pedagogical, Export & B2B Features

- **🛡️ Anti-Paste Learning Guard & Throttled Coaching**: Copy-paste and drag-and-drop text insertion are blocked in the writing workspace. Live Socratic guidance debounces on a 7-second typing pause with a minimum 15-word delta to prevent unnecessary token burn.
- **📐 Task-Specific Blueprints**: Differentiates prompts and rubrics across **Task 1 Academic** (overview + visual trend comparisons), **Task 1 General** (letter purpose, bullet coverage, tone), and **Task 2 Essay** (thesis + PEEL arguments).
- **🔍 Dual-Layer Assessment & Inline Essay Highlights**: Separates objective examiner scoring (Layer 1) from personalized Band gap coaching (Layer 2) with an interactive `InlineEssayHighlighter` filtering grammar, collocation, coherence, and strength spans.
- **🏫 B2B School Cohorts**: Teachers invite students with a 6-character code or `/workspace?joinCode=XXXXXX` link, assign targeted IELTS tasks with due dates and coach notes, and review submitted essays inline.
- **📄 PDF & Social Sharing**: Exports vector `.pdf` IELTS Test Report Forms (`pdf-service.ts`), generates shareable `/report/[id]` URLs, formats one-click Telegram results summaries, and copies formatted summaries to clipboard.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Optional: initialize Turso database tables & official prompts
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For verification before deployment:
```bash
npx tsc --noEmit
npm run build
```
