# 🚀 Supabase Cloud Database Integration Guide

This guide walks you through connecting your **Supabase (PostgreSQL)** database to the IELTS Writing Platform deployed on **Vercel**.

---

## 📋 Architecture Overview

- **Database**: PostgreSQL hosted on Supabase (free tier available with generous limits).
- **Frontend / Lambdas**: Next.js 14 hosted on Vercel.
- **Data Collections**:
  - `prompts`: **160 authentic IELTS Writing prompts** (150 Task 2 topics + 8 Task 1 visual charts/maps + 2 Task 1 General letters).
  - `profiles`: User accounts, target band scores, and practice settings.
  - `submissions`: Written essays with word count and time metrics.
  - `reports`: Dual-Layer Examiner evaluations, criterion scores, and tailored recommendations.
- **Zero-Downtime Fallback**: If Supabase credentials are missing or the connection is briefly offline, the platform automatically and seamlessly falls back to the in-memory bundled dataset.

---

## 🛠️ Step 1: Create a Free Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **"New Project"**.
3. Choose an organization, enter a project name (e.g., `ielts-writing-platform`), set a secure database password, and choose a region close to your target audience (e.g., Frankfurt, Singapore, or US East).
4. Click **"Create new project"** and wait about 1-2 minutes for the database to provision.

---

## 🗄️ Step 2: Run Database Schema & Seed Data

In your Supabase project dashboard:

1. Click on the **SQL Editor** icon in the left navigation sidebar.
2. Click **"New query"**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///home/shuhrat/Projects/1English_Writing_Platform/Writing_Platform/supabase/schema.sql) and paste it into the editor.
4. Click **"Run"** (or press `Cmd/Ctrl + Enter`).
   - This creates the `prompts`, `profiles`, `submissions`, and `reports` tables, indexes, and Row Level Security (RLS) policies.
5. Create another **"New query"**.
6. Copy the entire contents of [`supabase/seed.sql`](file:///home/shuhrat/Projects/1English_Writing_Platform/Writing_Platform/supabase/seed.sql) and paste it into the editor.
7. Click **"Run"**.
   - This populates all **160 IELTS topics** (150 Task 2 essays across 10 categories + 10 Task 1 topics) into your `prompts` table.
8. You can verify the data by navigating to the **Table Editor** -> `prompts` table: you will see all 160 rows.

---

## 🔑 Step 3: Get API Keys & Configure Environment Variables

1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy the following two values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon public Key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### For Local Development:
Open or create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### For Vercel Production Deployment:
1. Go to your project on the [Vercel Dashboard](https://vercel.com).
2. Go to **Settings** -> **Environment Variables**.
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Save**.
5. Redeploy your latest commit or trigger a new deployment.

---

## 🔍 How to Test
1. Open the IELTS Task Library modal by clicking **"Change Prompt"** in the writing workspace.
2. Notice the badge at the top showing:
   - `160 Prompts (Supabase DB)` when connected to Supabase.
   - `160 Prompts (Bundled DB)` in offline/fallback mode.
3. Test the search bar by typing any keyword (e.g. `environment`, `artificial intelligence`, `traffic`).
4. Filter by category (e.g., `Education & Higher Learning`, `Technology, AI & Digital Life`, `Crime & Law Enforcement`).
