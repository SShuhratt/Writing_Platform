# IELTS Writing Assistant Platform

An official-grade, adaptive IELTS writing platform built with Next.js 14, Tailwind CSS, Zustand, and Google Gemini API.

## 🌐 Live Production Deployment
- **Live Vercel Application**: [https://writing-platform-git-main-sshuhratts-projects.vercel.app/](https://writing-platform-git-main-sshuhratts-projects.vercel.app/)
- **GitHub Repository**: [https://github.com/SShuhratt/Writing_Platform](https://github.com/SShuhratt/Writing_Platform)

---

## 🔑 Default Credentials

| Role | Username / Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Ordinary Student** | `testuser@gmail.com` | `testuser1` | Access to Practice Workspace (`/workspace`), custom prompts, real-time Socratic feedback, & Dual-Layer Reports. |
| **Platform Admin** | `shuhrat3` | `$Huhrat333` | Access to Practice Workspace + Admin Analytics Dashboard (`/admin`). |

---

## 🚦 Routes & Pages

- **`/`**: Landing Page (Hero, Socratic Band 5.0–9.0 showcase, 3-step workflow, footer).
- **`/workspace`**: Real-time Socratic drafting surface with Anti-Paste Learning Guard, dynamic level offers, and Dual-Layer Assessment.
- **`/admin`**: Guarded Admin Monitoring Dashboard (KPIs, band distribution charts, live practice feed).

---

## ✨ Key Pedagogical & Export Features

- **🛡️ Anti-Paste Learning Guard**: Copy-paste and drag-and-drop text insertion are strictly blocked in the writing workspace, enforcing authentic active writing and muscle memory retention.
- **📄 Downloadable PDF Reports**: Export high-resolution, vector-sharp `.pdf` official IELTS Test Report Forms featuring overall band scores, 4-criteria breakdown, examiner commentary, and candidate essay transcripts.
- **✈️ Telegram Results Sharing**: Instant one-click Telegram sharing formatted with score emojis, criteria breakdown, and practice links for teachers, friends, or study groups.
- **📋 Clipboard Summary Export**: Quick copy of score summary for WhatsApp, Discord, or email.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
