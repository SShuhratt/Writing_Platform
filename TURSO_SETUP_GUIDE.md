# ⚡ Turso (LibSQL) Integration & One-Click Deploy Guide

This guide explains how Turso is wired into this **Antigravity Workspace** and **Vercel** so that you can manage the database right here and deploy both frontend + backend at once.

---

## 🌟 How the Automated Flow Works

1. **Inside Antigravity Workspace**:
   - The official **Turso CLI (`v1.0.33`)** is installed at `/home/shuhrat/.turso/turso`.
   - The high-performance **`@libsql/client`** driver is integrated into Next.js.
   - Run `npm run db:seed` right from this terminal: it automatically connects to Turso, creates tables (`prompts`, `profiles`, `submissions`, `reports`), and seeds all **160 authentic IELTS topics**.
2. **Inside Vercel (Continuous Deployment)**:
   - Every `git push origin main` triggers an automatic Vercel deployment.
   - Vercel connects to Turso via two environment variables (`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`).
   - The database **never pauses, never sleeps**, and comes with **9 GB free storage** and **1 billion free reads/month**.
   - If the database is ever unreachable or offline, the platform seamlessly falls back to the in-memory bundled database without crashing.

---

## 🛠️ Step 1: Create Your Turso Database

You can do this either via the **Web Dashboard** or the **Terminal CLI**:

### Option A: Web Dashboard (Fastest, 1 minute)
1. Go to [turso.tech](https://turso.tech) and sign up with GitHub or Google.
2. Click **"Create Database"**, name it `ielts-platform`, and pick a region close to your users (e.g. Frankfurt `fra`, London `lhr`, or Singapore `sin`).
3. Click your database -> Click **"Connect"**:
   - Copy **Database URL** (`libsql://ielts-platform-username.turso.io`)
   - Copy or generate an **Auth Token**.

### Option B: From the Terminal CLI
Run in terminal:
```bash
~/.turso/turso auth signup   # or ~/.turso/turso auth login
~/.turso/turso db create ielts-platform
~/.turso/turso db show ielts-platform --url
~/.turso/turso db tokens create ielts-platform
```

---

## 🚀 Step 2: Seed the 160 Topics into Turso

Add the credentials to your local `.env.local` file:
```env
TURSO_DATABASE_URL=libsql://ielts-platform-yourname.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token-here
```

Then run the automated seeding script:
```bash
npm run db:seed
```
This will:
- Create `prompts`, `profiles`, `submissions`, and `reports` tables.
- Seed all 150 Task 2 topics and 10 Task 1 topics.

---

## 🌐 Step 3: Add Variables to Vercel (One-Time Setup)

To enable Vercel to connect to your live Turso database on every deploy:

1. Go to your project on the [Vercel Dashboard](https://vercel.com).
2. Go to **Settings** -> **Environment Variables**.
3. Add the two variables:
   - `TURSO_DATABASE_URL` = `libsql://ielts-platform-yourname.turso.io`
   - `TURSO_AUTH_TOKEN` = `your-auth-token`
4. Click **Save**.

---

## 🎯 Continuous Deployment Workflow

From now on, whenever you make changes:
```bash
git add .
git commit -m "your update message"
git push origin main
```
Vercel automatically builds and deploys your changes immediately, fully connected to your never-sleeping Turso database!
