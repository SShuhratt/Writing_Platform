import { BillingPlanSpec } from '@/types/billing';

export const PUBLIC_FREE_DAILY_LIMIT = 2;
export const PUBLIC_PRO_DAILY_LIMIT = 20;

export const CANONICAL_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://writing-platform-two.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

export const PUBLIC_SUPPORT_EMAIL = (
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@ieltsmentor.ai'
).trim();

export const PUBLIC_SUPPORT_TELEGRAM = (
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || ''
).trim();

export const PUBLIC_PRICING_PLANS: BillingPlanSpec[] = [
  {
    code: 'FREE',
    name: 'Free Practice',
    tagline: 'Daily active drafting & essential AI grading',
    durationDays: 0,
    dailyLimit: PUBLIC_FREE_DAILY_LIMIT,
    priceUzs: 0,
    priceUsd: 0,
    features: [
      '2 full Dual-Layer AI evaluations per day',
      'Anti-Paste Learning Guard & Socratic Coach',
      'Task 1 & Task 2 prompt library access',
    ],
  },
  {
    code: 'PRO_MONTHLY',
    name: 'IELTS Pro Monthly',
    tagline: 'Intensive exam prep with inline diagnostics & PDFs',
    durationDays: 30,
    dailyLimit: PUBLIC_PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_UZS || 49000),
    priceUsd: Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_USD || 9),
    badge: 'Most Popular',
    features: [
      '20 full Dual-Layer AI evaluations per day (fair-use)',
      'Sentence-level grammar, collocation & coherence highlights',
      'Official TRF PDF export & shareable /report/[id] links',
    ],
  },
  {
    code: 'PRO_QUARTERLY',
    name: 'IELTS Pro Quarterly',
    tagline: 'Full 90-day preparation runway with maximum savings',
    durationDays: 90,
    dailyLimit: PUBLIC_PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.NEXT_PUBLIC_PRO_QUARTERLY_PRICE_UZS || 119000),
    priceUsd: Number(process.env.NEXT_PUBLIC_PRO_QUARTERLY_PRICE_USD || 22),
    badge: 'Save 19%',
    features: [
      '20 full Dual-Layer AI evaluations per day for 90 days',
      'All Pro diagnostics, Band trend history & PDF exports',
      'Priority support & academy voucher compatibility',
    ],
  },
  {
    code: 'SCHOOL_SEAT',
    name: 'Academy / Cohort Seat',
    tagline: 'Teacher-managed classroom seats & cohort grading analytics',
    durationDays: 30,
    dailyLimit: PUBLIC_PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.NEXT_PUBLIC_SCHOOL_SEAT_PRICE_UZS || 25000),
    priceUsd: Number(process.env.NEXT_PUBLIC_SCHOOL_SEAT_PRICE_USD || 2),
    badge: 'B2B Schools',
    features: [
      'Classroom cohort invite codes & deadline tracking',
      '20 daily student evaluations included per active seat',
      'Teacher cohort gradebook & essay review dashboard',
    ],
  },
];

