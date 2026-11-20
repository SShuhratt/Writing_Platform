import crypto from 'crypto';
import { getTursoClient, isTursoConfigured } from '@/lib/turso';
import { getServiceSupabase, isServiceSupabaseConfigured } from '@/lib/supabase';
import { SessionRole } from '@/lib/server-auth';
import {
  AdminBillingOverview,
  BillingCurrency,
  BillingOrder,
  BillingOrderStatus,
  BillingPlanSpec,
  BillingStatusSummary,
  PaymentMethod,
  PlanCode,
  PromoVoucher,
  QuotaSnapshot,
  UserEntitlement,
} from '@/types/billing';

export const FREE_DAILY_LIMIT = 2;
export const PRO_DAILY_LIMIT = 20;
export const FREE_GUIDANCE_DAILY_LIMIT = 30;
export const PRO_GUIDANCE_DAILY_LIMIT = 150;

export const BILLING_PLANS: BillingPlanSpec[] = [
  {
    code: 'FREE',
    name: 'Free Practice',
    tagline: 'Daily active drafting & essential AI grading',
    durationDays: 0,
    dailyLimit: FREE_DAILY_LIMIT,
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
    dailyLimit: PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.PRO_MONTHLY_PRICE_UZS || 49000),
    priceUsd: Number(process.env.PRO_MONTHLY_PRICE_USD || 9),
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
    dailyLimit: PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.PRO_QUARTERLY_PRICE_UZS || 119000),
    priceUsd: Number(process.env.PRO_QUARTERLY_PRICE_USD || 22),
    badge: 'Save 19%',
    features: [
      '20 full Dual-Layer AI evaluations per day for 90 days',
      'All Pro diagnostics, Band trend history & PDF exports',
      'Priority model routing across Task 1 & Task 2',
    ],
  },
  {
    code: 'SCHOOL_SEAT',
    name: 'School Cohort Pass',
    tagline: 'B2B academy & tutor group writing license',
    durationDays: 30,
    dailyLimit: PRO_DAILY_LIMIT,
    priceUzs: Number(process.env.SCHOOL_SEAT_PRICE_UZS || 25000),
    priceUsd: Number(process.env.SCHOOL_SEAT_PRICE_USD || 2),
    features: [
      '20 full evaluations per day per enrolled student',
      'Linked Teacher Cohort review & coaching feedback',
      'Redeemable via bulk academy voucher batches',
    ],
  },
];

interface BillingMemoryStore {
  entitlements: Map<string, UserEntitlement>;
  orders: Map<string, BillingOrder>;
  vouchers: Map<string, PromoVoucher>;
  redemptions: Set<string>;
  quotas: Map<string, { count: number; dateUtc: string }>;
  tursoReady: boolean;
}

const globalForBilling = globalThis as unknown as {
  __ieltsBillingStore?: BillingMemoryStore;
};

function getBillingStore(): BillingMemoryStore {
  if (!globalForBilling.__ieltsBillingStore) {
    globalForBilling.__ieltsBillingStore = {
      entitlements: new Map(),
      orders: new Map(),
      vouchers: new Map(),
      redemptions: new Set(),
      quotas: new Map(),
      tursoReady: false,
    };
  }
  return globalForBilling.__ieltsBillingStore;
}

function getServerSupabase() {
  return getServiceSupabase();
}

function hasPrimaryDatabase(): boolean {
  return isTursoConfigured() || isServiceSupabaseConfigured();
}

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen).trim();
}

export function getPlanSpec(planCode: string): BillingPlanSpec | undefined {
  return BILLING_PLANS.find((p) => p.code === planCode);
}

export function getP2PPaymentInfo() {
  const rawCard = (process.env.BILLING_P2P_CARD_NUMBER || '').trim();
  const digitsOnly = rawCard.replace(/\D/g, '');
  const configured =
    Boolean(rawCard) &&
    !rawCard.includes('Configure BILLING_P2P_CARD_NUMBER') &&
    digitsOnly.length >= 12 &&
    !/^86000+$/.test(digitsOnly);

  return {
    configured,
    cardNumber: configured ? rawCard : '',
    cardHolder: process.env.BILLING_P2P_CARD_HOLDER || 'IELTS Mentor Official',
    bankName: process.env.BILLING_P2P_BANK_NAME || 'Humo / Uzcard',
  };
}

export function getQuotaWindowMetrics() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();
  const resetsAt = now.getTime() + msUntilMidnight;
  const resetsInHours = Math.max(1, Math.ceil(msUntilMidnight / (1000 * 60 * 60)));
  return { today, resetsAt, resetsInHours };
}

async function ensureTursoBillingTables(turso: any): Promise<void> {
  const store = getBillingStore();
  if (store.tursoReady) return;

  try {
    await turso.batch([
      `CREATE TABLE IF NOT EXISTS user_entitlements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        plan_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        daily_limit INTEGER NOT NULL DEFAULT 20,
        starts_at INTEGER NOT NULL,
        expires_at INTEGER,
        metadata TEXT,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON user_entitlements(user_id, status)`,
      `CREATE TABLE IF NOT EXISTS billing_orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT,
        plan_code TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'UZS',
        amount_paid REAL NOT NULL DEFAULT 0,
        amount_uzs INTEGER NOT NULL DEFAULT 0,
        amount_usd REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'card_p2p',
        status TEXT NOT NULL DEFAULT 'pending',
        receipt_note TEXT,
        receipt_url TEXT,
        external_ref TEXT,
        created_at INTEGER NOT NULL,
        confirmed_at INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS idx_billing_orders_user ON billing_orders(user_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS promo_vouchers (
        code TEXT PRIMARY KEY,
        plan_code TEXT NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 30,
        daily_limit INTEGER NOT NULL DEFAULT 20,
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        cohort_id TEXT,
        created_by TEXT NOT NULL,
        expires_at INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS voucher_redemptions (
        id TEXT PRIMARY KEY,
        voucher_code TEXT NOT NULL,
        user_id TEXT NOT NULL,
        redeemed_at INTEGER NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_redemptions_unique ON voucher_redemptions(voucher_code, user_id)`,
      `CREATE TABLE IF NOT EXISTS daily_quotas (
        identifier TEXT NOT NULL,
        date_utc TEXT NOT NULL,
        used_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (identifier, date_utc)
      )`,
    ]);

    const orderCols = await turso.execute(`PRAGMA table_info(billing_orders)`);
    const colNames = new Set(orderCols.rows.map((r: any) => String(r.name)));
    if (!colNames.has('currency')) {
      await turso.execute(`ALTER TABLE billing_orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'UZS'`);
    }
    if (!colNames.has('amount_paid')) {
      await turso.execute(`ALTER TABLE billing_orders ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0`);
    }
    if (!colNames.has('receipt_url')) {
      await turso.execute(`ALTER TABLE billing_orders ADD COLUMN receipt_url TEXT`);
    }
    store.tursoReady = true;
  } catch (err) {
    console.warn('Could not verify Turso billing tables:', err);
  }
}

function rowToEntitlement(row: any): UserEntitlement {
  let metadata: Record<string, unknown> | undefined;
  if (typeof row.metadata === 'string' && row.metadata) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = undefined;
    }
  } else if (row.metadata && typeof row.metadata === 'object') {
    metadata = row.metadata;
  }

  return {
    id: String(row.id),
    userId: String(row.user_id),
    provider: row.provider,
    planCode: row.plan_code,
    status: row.status,
    dailyLimit: Number(row.daily_limit || PRO_DAILY_LIMIT),
    startsAt: Number(row.starts_at),
    expiresAt: row.expires_at !== null && row.expires_at !== undefined ? Number(row.expires_at) : null,
    metadata,
    updatedAt: Number(row.updated_at || Date.now()),
  };
}

function rowToOrder(row: any): BillingOrder {
  const amountUzs = Number(row.amount_uzs || 0);
  const amountUsd = Number(row.amount_usd || 0);
  const currency: BillingCurrency =
    row.currency === 'USD' || (amountUzs === 0 && amountUsd > 0) ? 'USD' : 'UZS';
  const amountPaid =
    row.amount_paid !== undefined && row.amount_paid !== null && Number(row.amount_paid) > 0
      ? Number(row.amount_paid)
      : currency === 'USD'
      ? amountUsd
      : amountUzs;

  return {
    id: String(row.id),
    userId: String(row.user_id),
    userEmail: String(row.user_email || ''),
    userName: row.user_name ? String(row.user_name) : undefined,
    planCode: row.plan_code,
    currency,
    amountPaid,
    amountUzs: currency === 'UZS' ? amountPaid || amountUzs : 0,
    amountUsd: currency === 'USD' ? amountPaid || amountUsd : 0,
    paymentMethod: row.payment_method,
    status: row.status,
    receiptNote: row.receipt_note ? String(row.receipt_note) : undefined,
    receiptUrl: row.receipt_url ? String(row.receipt_url) : undefined,
    externalRef: row.external_ref ? String(row.external_ref) : undefined,
    createdAt: Number(row.created_at || Date.now()),
    confirmedAt: row.confirmed_at ? Number(row.confirmed_at) : undefined,
  };
}

function rowToVoucher(row: any): PromoVoucher {
  return {
    code: String(row.code),
    planCode: row.plan_code,
    durationDays: Number(row.duration_days || 30),
    dailyLimit: Number(row.daily_limit || PRO_DAILY_LIMIT),
    maxUses: Number(row.max_uses || 1),
    usedCount: Number(row.used_count || 0),
    cohortId: row.cohort_id ? String(row.cohort_id) : undefined,
    createdBy: String(row.created_by || 'admin'),
    expiresAt: row.expires_at !== null && row.expires_at !== undefined ? Number(row.expires_at) : null,
    isActive: row.is_active === true || Number(row.is_active) === 1,
    createdAt: Number(row.created_at || Date.now()),
  };
}

async function saveEntitlement(entitlement: UserEntitlement): Promise<void> {
  const store = getBillingStore();
  store.entitlements.set(entitlement.id, entitlement);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO user_entitlements
                (id, user_id, provider, plan_code, status, daily_limit, starts_at, expires_at, metadata, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            entitlement.id,
            entitlement.userId,
            entitlement.provider,
            entitlement.planCode,
            entitlement.status,
            entitlement.dailyLimit,
            entitlement.startsAt,
            entitlement.expiresAt,
            entitlement.metadata ? JSON.stringify(entitlement.metadata) : null,
            entitlement.updatedAt,
          ],
        });
      } catch (err) {
        console.warn('Could not persist entitlement to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('user_entitlements').upsert({
          id: entitlement.id,
          user_id: entitlement.userId,
          provider: entitlement.provider,
          plan_code: entitlement.planCode,
          status: entitlement.status,
          daily_limit: entitlement.dailyLimit,
          starts_at: entitlement.startsAt,
          expires_at: entitlement.expiresAt,
          metadata: entitlement.metadata || null,
          updated_at: entitlement.updatedAt,
        });
      } catch (err) {
        console.warn('Could not persist entitlement to Supabase:', err);
      }
    }
  }
}

async function fetchUserEntitlements(userId: string): Promise<UserEntitlement[]> {
  const store = getBillingStore();
  const dbActive = hasPrimaryDatabase();
  const dbResults = new Map<string, UserEntitlement>();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM user_entitlements WHERE user_id = ?`,
          args: [userId],
        });
        for (const row of res.rows) {
          const item = rowToEntitlement(row);
          dbResults.set(item.id, item);
          store.entitlements.set(item.id, item);
        }
      } catch (err) {
        console.warn('Entitlement Turso lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId);
        if (data) {
          for (const row of data) {
            const item = rowToEntitlement(row);
            dbResults.set(item.id, item);
            store.entitlements.set(item.id, item);
          }
        }
      } catch (err) {
        console.warn('Entitlement Supabase lookup failed:', err);
      }
    }
  }

  const now = Date.now();
  const sourceList = dbActive
    ? Array.from(dbResults.values())
    : Array.from(store.entitlements.values());

  return sourceList
    .filter(
      (item) =>
        item.userId === userId &&
        item.status === 'active' &&
        (item.expiresAt === null || item.expiresAt > now)
    )
    .sort((a, b) => b.dailyLimit - a.dailyLimit || b.updatedAt - a.updatedAt);
}

/**
 * Resolves the highest active plan & daily evaluation limit for a user.
 */
export async function resolveEffectivePlan(
  userId?: string,
  role?: SessionRole
): Promise<{
  planCode: PlanCode | 'STAFF';
  dailyLimit: number;
  entitlement: UserEntitlement | null;
}> {
  if (role === 'admin' || role === 'teacher') {
    return { planCode: 'STAFF', dailyLimit: 999, entitlement: null };
  }

  if (!userId || userId.startsWith('user-')) {
    return { planCode: 'FREE', dailyLimit: FREE_DAILY_LIMIT, entitlement: null };
  }

  const active = await fetchUserEntitlements(userId);
  if (active.length === 0) {
    return { planCode: 'FREE', dailyLimit: FREE_DAILY_LIMIT, entitlement: null };
  }

  const top = active[0];
  return {
    planCode: top.planCode,
    dailyLimit: Math.max(FREE_DAILY_LIMIT, top.dailyLimit),
    entitlement: top,
  };
}

async function readDailyCount(identifier: string, today: string): Promise<number> {
  const store = getBillingStore();
  const key = `${identifier}:${today}`;

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT used_count FROM daily_quotas WHERE identifier = ? AND date_utc = ? LIMIT 1`,
          args: [identifier, today],
        });
        const count = res.rows.length > 0 ? Number((res.rows[0] as any).used_count || 0) : 0;
        store.quotas.set(key, { count, dateUtc: today });
        return count;
      } catch (err) {
        console.warn('Quota Turso read failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('daily_quotas')
          .select('used_count')
          .eq('identifier', identifier)
          .eq('date_utc', today)
          .maybeSingle();
        const count = data ? Number(data.used_count || 0) : 0;
        store.quotas.set(key, { count, dateUtc: today });
        return count;
      } catch (err) {
        console.warn('Quota Supabase read failed:', err);
      }
    }
  }

  const mem = store.quotas.get(key);
  return mem && mem.dateUtc === today ? mem.count : 0;
}

async function consumeAtomicDailyQuotaRecord(
  identifier: string,
  today: string,
  limit: number
): Promise<{ allowed: boolean; used: number }> {
  const store = getBillingStore();
  const key = `${identifier}:${today}`;
  const now = Date.now();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        await turso.execute({
          sql: `INSERT OR IGNORE INTO daily_quotas (identifier, date_utc, used_count, updated_at)
                VALUES (?, ?, 0, ?)`,
          args: [identifier, today, now],
        });
        const upd = await turso.execute({
          sql: `UPDATE daily_quotas
                SET used_count = used_count + 1, updated_at = ?
                WHERE identifier = ? AND date_utc = ? AND used_count < ?`,
          args: [now, identifier, today, limit],
        });
        const sel = await turso.execute({
          sql: `SELECT used_count FROM daily_quotas WHERE identifier = ? AND date_utc = ? LIMIT 1`,
          args: [identifier, today],
        });
        const used = sel.rows.length > 0 ? Number((sel.rows[0] as any).used_count || 0) : 0;
        store.quotas.set(key, { count: used, dateUtc: today });
        return {
          allowed: Number(upd.rowsAffected || 0) === 1,
          used,
        };
      } catch (err) {
        console.warn('Atomic Turso quota increment failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('consume_daily_quota', {
          p_identifier: identifier,
          p_date_utc: today,
          p_limit: limit,
          p_now: now,
        });
        if (!error && Array.isArray(data) && data.length > 0) {
          const row = data[0] as any;
          const used = Number(row.used_count || 0);
          store.quotas.set(key, { count: used, dateUtc: today });
          return {
            allowed: Boolean(row.allowed),
            used,
          };
        }
      } catch (err) {
        console.warn('Atomic Supabase quota RPC failed:', err);
      }
    }
  }

  const currentMem = store.quotas.get(key);
  const currentUsed = currentMem && currentMem.dateUtc === today ? currentMem.count : 0;
  if (currentUsed >= limit) {
    return { allowed: false, used: currentUsed };
  }
  const nextUsed = currentUsed + 1;
  store.quotas.set(key, { count: nextUsed, dateUtc: today });
  return { allowed: true, used: nextUsed };
}

/**
 * Returns the current user's evaluation quota usage without consuming an attempt.
 */
export async function getDailyQuotaSnapshot(
  identifier: string,
  userId?: string,
  role?: SessionRole
): Promise<QuotaSnapshot> {
  const { today, resetsAt, resetsInHours } = getQuotaWindowMetrics();
  const resolved = await resolveEffectivePlan(userId, role);

  if (resolved.planCode === 'STAFF') {
    return {
      allowed: true,
      planCode: 'STAFF',
      limit: 999,
      used: 0,
      remaining: 999,
      resetsAt,
      resetsInHours,
    };
  }

  const used = await readDailyCount(identifier, today);
  const remaining = Math.max(0, resolved.dailyLimit - used);
  return {
    allowed: used < resolved.dailyLimit,
    planCode: resolved.planCode,
    limit: resolved.dailyLimit,
    used,
    remaining,
    resetsAt,
    resetsInHours,
  };
}

/**
 * Atomically checks against the active plan limit and records 1 consumed evaluation.
 */
export async function consumeDailyEvaluationQuota(
  identifier: string,
  userId?: string,
  role?: SessionRole
): Promise<QuotaSnapshot> {
  const { today, resetsAt, resetsInHours } = getQuotaWindowMetrics();
  const resolved = await resolveEffectivePlan(userId, role);

  if (resolved.planCode === 'STAFF') {
    return {
      allowed: true,
      planCode: 'STAFF',
      limit: 999,
      used: 0,
      remaining: 999,
      resetsAt,
      resetsInHours,
    };
  }

  const result = await consumeAtomicDailyQuotaRecord(identifier, today, resolved.dailyLimit);
  return {
    allowed: result.allowed,
    planCode: resolved.planCode,
    limit: resolved.dailyLimit,
    used: result.used,
    remaining: Math.max(0, resolved.dailyLimit - result.used),
    resetsAt,
    resetsInHours,
  };
}

/**
 * Atomically checks & records 1 daily Socratic live coaching request to protect Gemini token spend.
 */
export async function consumeDailyGuidanceQuota(
  identifier: string,
  userId?: string,
  role?: SessionRole
): Promise<QuotaSnapshot> {
  const { today, resetsAt, resetsInHours } = getQuotaWindowMetrics();
  const resolved = await resolveEffectivePlan(userId, role);

  if (resolved.planCode === 'STAFF') {
    return {
      allowed: true,
      planCode: 'STAFF',
      limit: 999,
      used: 0,
      remaining: 999,
      resetsAt,
      resetsInHours,
    };
  }

  const guidanceLimit =
    resolved.planCode === 'FREE' ? FREE_GUIDANCE_DAILY_LIMIT : PRO_GUIDANCE_DAILY_LIMIT;
  const guidanceIdentifier = `guidance:${identifier}`;
  const result = await consumeAtomicDailyQuotaRecord(guidanceIdentifier, today, guidanceLimit);

  return {
    allowed: result.allowed,
    planCode: resolved.planCode,
    limit: guidanceLimit,
    used: result.used,
    remaining: Math.max(0, guidanceLimit - result.used),
    resetsAt,
    resetsInHours,
  };
}

/**
 * Grants or extends a user's active Pro entitlement cleanly across plan upgrades and vouchers,
 * carrying remaining active Pro days forward rather than wasting overlapping duration.
 */
export async function grantUserEntitlement(params: {
  userId: string;
  provider: UserEntitlement['provider'];
  planCode: PlanCode;
  durationDays: number;
  dailyLimit?: number;
  metadata?: Record<string, unknown>;
}): Promise<UserEntitlement> {
  const plan = getPlanSpec(params.planCode) || BILLING_PLANS[1];
  const now = Date.now();
  const activeList = await fetchUserEntitlements(params.userId);
  const maxActiveExpiry = activeList.reduce((maxExp, ent) => {
    const exp = ent.expiresAt ?? now;
    return exp > maxExp ? exp : maxExp;
  }, now);
  const maxDailyLimit = Math.max(
    params.dailyLimit || plan.dailyLimit,
    ...activeList.map((e) => e.dailyLimit)
  );

  // If extending an identical provider+plan, update in place; otherwise consolidate and expire older overlapping records
  const samePlanRecord = activeList.find(
    (e) => e.provider === params.provider && e.planCode === params.planCode
  );
  const durationMs = Math.max(1, params.durationDays) * 24 * 60 * 60 * 1000;

  const entitlement: UserEntitlement = {
    id: samePlanRecord?.id || `ent-${now}-${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId,
    provider: params.provider,
    planCode: plan.code,
    status: 'active',
    dailyLimit: maxDailyLimit,
    startsAt: samePlanRecord?.startsAt || now,
    expiresAt: maxActiveExpiry + durationMs,
    metadata: {
      ...(samePlanRecord?.metadata || {}),
      ...(params.metadata || {}),
    },
    updatedAt: now,
  };

  for (const oldEnt of activeList) {
    if (oldEnt.id !== entitlement.id) {
      oldEnt.status = 'expired';
      oldEnt.updatedAt = now;
      await saveEntitlement(oldEnt);
    }
  }

  await saveEntitlement(entitlement);
  return entitlement;
}

async function findVoucherByCode(code: string): Promise<PromoVoucher | null> {
  const store = getBillingStore();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM promo_vouchers WHERE code = ? LIMIT 1`,
          args: [code],
        });
        if (res.rows.length > 0) {
          const v = rowToVoucher(res.rows[0]);
          store.vouchers.set(v.code, v);
          return v;
        }
        return null;
      } catch (err) {
        console.warn('Voucher Turso lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('promo_vouchers')
          .select('*')
          .eq('code', code)
          .maybeSingle();
        if (data) {
          const v = rowToVoucher(data);
          store.vouchers.set(v.code, v);
          return v;
        }
        return null;
      } catch (err) {
        console.warn('Voucher Supabase lookup failed:', err);
      }
    }
  }

  return store.vouchers.get(code) || null;
}

async function hasUserRedeemedVoucher(code: string, userId: string): Promise<boolean> {
  const store = getBillingStore();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT id FROM voucher_redemptions WHERE voucher_code = ? AND user_id = ? LIMIT 1`,
          args: [code, userId],
        });
        return res.rows.length > 0;
      } catch (err) {
        console.warn('Voucher redemption Turso lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('voucher_redemptions')
          .select('id')
          .eq('voucher_code', code)
          .eq('user_id', userId)
          .maybeSingle();
        return Boolean(data);
      } catch (err) {
        console.warn('Voucher redemption Supabase lookup failed:', err);
      }
    }
  }

  return store.redemptions.has(`${code}:${userId}`);
}

/**
 * Atomically redeems a promo or school license voucher code for the authenticated user.
 */
export async function redeemPromoVoucher(params: {
  code: string;
  userId: string;
}): Promise<{ success: boolean; entitlement?: UserEntitlement; error?: string }> {
  const cleanCode = sanitizeText(params.code, 40).toUpperCase();
  if (!cleanCode) {
    return { success: false, error: 'Please enter a valid voucher or access code.' };
  }

  const now = Date.now();
  const redemptionId = `red-${now}-${crypto.randomBytes(3).toString('hex')}`;
  let redeemedVoucher: {
    code: string;
    planCode: PlanCode;
    durationDays: number;
    dailyLimit: number;
    cohortId?: string;
  } | null = null;

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      await ensureTursoBillingTables(turso);
      const existingVoucher = await findVoucherByCode(cleanCode);
      if (!existingVoucher || !existingVoucher.isActive) {
        return { success: false, error: 'Voucher code not found or no longer active.' };
      }
      if (existingVoucher.expiresAt && existingVoucher.expiresAt < now) {
        return { success: false, error: 'This voucher code has expired.' };
      }
      if (await hasUserRedeemedVoucher(cleanCode, params.userId)) {
        return { success: false, error: 'You have already redeemed this voucher code.' };
      }

      const updRes = await turso.execute({
        sql: `UPDATE promo_vouchers
              SET used_count = used_count + 1
              WHERE code = ? AND is_active = 1 AND used_count < max_uses AND (expires_at IS NULL OR expires_at >= ?)`,
        args: [cleanCode, now],
      });

      if (Number(updRes.rowsAffected || 0) !== 1) {
        return { success: false, error: 'This voucher code has reached its redemption limit or expired.' };
      }

      try {
        await turso.execute({
          sql: `INSERT INTO voucher_redemptions (id, voucher_code, user_id, redeemed_at) VALUES (?, ?, ?, ?)`,
          args: [redemptionId, cleanCode, params.userId, now],
        });
      } catch (err) {
        // Compensate if user simultaneously inserted duplicate redemption
        await turso.execute({
          sql: `UPDATE promo_vouchers SET used_count = MAX(0, used_count - 1) WHERE code = ?`,
          args: [cleanCode],
        });
        console.warn('Duplicate or failed Turso voucher redemption:', err);
        return { success: false, error: 'You have already redeemed this voucher code.' };
      }

      redeemedVoucher = {
        code: existingVoucher.code,
        planCode: existingVoucher.planCode,
        durationDays: existingVoucher.durationDays,
        dailyLimit: existingVoucher.dailyLimit,
        cohortId: existingVoucher.cohortId,
      };
    }
  } else if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.rpc('redeem_promo_voucher', {
        p_code: cleanCode,
        p_user_id: params.userId,
        p_redemption_id: redemptionId,
        p_now: now,
      });

      if (error || !Array.isArray(data) || data.length === 0) {
        return { success: false, error: 'Could not verify voucher code. Please try again.' };
      }
      const row = data[0] as any;
      if (!row.success) {
        const errorMap: Record<string, string> = {
          NOT_FOUND_OR_INACTIVE: 'Voucher code not found or no longer active.',
          EXPIRED: 'This voucher code has expired.',
          MAX_USES_REACHED: 'This voucher code has reached its redemption limit.',
          ALREADY_REDEEMED: 'You have already redeemed this voucher code.',
        };
        return {
          success: false,
          error: errorMap[String(row.error_code)] || 'Could not redeem voucher code.',
        };
      }

      redeemedVoucher = {
        code: cleanCode,
        planCode: row.plan_code as PlanCode,
        durationDays: Number(row.duration_days || 30),
        dailyLimit: Number(row.daily_limit || PRO_DAILY_LIMIT),
        cohortId: row.cohort_id ? String(row.cohort_id) : undefined,
      };
    }
  } else {
    const store = getBillingStore();
    const voucher = store.vouchers.get(cleanCode);
    if (!voucher || !voucher.isActive) {
      return { success: false, error: 'Voucher code not found or no longer active.' };
    }
    if (voucher.expiresAt && voucher.expiresAt < now) {
      return { success: false, error: 'This voucher code has expired.' };
    }
    if (voucher.usedCount >= voucher.maxUses) {
      return { success: false, error: 'This voucher code has reached its redemption limit.' };
    }
    if (store.redemptions.has(`${voucher.code}:${params.userId}`)) {
      return { success: false, error: 'You have already redeemed this voucher code.' };
    }

    voucher.usedCount += 1;
    store.vouchers.set(voucher.code, voucher);
    store.redemptions.add(`${voucher.code}:${params.userId}`);
    redeemedVoucher = {
      code: voucher.code,
      planCode: voucher.planCode,
      durationDays: voucher.durationDays,
      dailyLimit: voucher.dailyLimit,
      cohortId: voucher.cohortId,
    };
  }

  if (!redeemedVoucher) {
    return { success: false, error: 'Voucher service is unavailable.' };
  }

  const entitlement = await grantUserEntitlement({
    userId: params.userId,
    provider: redeemedVoucher.planCode === 'SCHOOL_SEAT' ? 'school' : 'voucher',
    planCode: redeemedVoucher.planCode,
    durationDays: redeemedVoucher.durationDays,
    dailyLimit: redeemedVoucher.dailyLimit,
    metadata: { voucherCode: redeemedVoucher.code, cohortId: redeemedVoucher.cohortId },
  });

  return { success: true, entitlement };
}

/**
 * Creates a standalone Pro plan purchase order with currency isolation and duplicate pending guard.
 */
export async function createBillingOrder(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  planCode: PlanCode;
  currency?: BillingCurrency;
  paymentMethod?: PaymentMethod;
  receiptNote?: string;
  receiptUrl?: string;
}): Promise<{ success: boolean; order?: BillingOrder; error?: string }> {
  const plan = getPlanSpec(params.planCode);
  if (!plan || plan.code === 'FREE') {
    return { success: false, error: 'Please choose a valid paid IELTS Pro plan.' };
  }

  const paymentMethod: PaymentMethod = params.paymentMethod || 'card_p2p';
  if (paymentMethod === 'card_p2p' && !getP2PPaymentInfo().configured) {
    return {
      success: false,
      error:
        'Manual card transfer is currently unconfigured. Please redeem a voucher or use an automated payment option.',
    };
  }

  const existingOrders = await listUserOrders(params.userId);
  const existingPending = existingOrders.find(
    (o) => o.status === 'pending' && o.planCode === plan.code
  );
  if (existingPending) {
    return {
      success: false,
      order: existingPending,
      error:
        'You already have a pending upgrade order for this plan awaiting verification. Please wait for approval.',
    };
  }

  const currency: BillingCurrency = params.currency === 'USD' ? 'USD' : 'UZS';
  const amountPaid = currency === 'USD' ? plan.priceUsd : plan.priceUzs;
  const safeReceiptUrl =
    typeof params.receiptUrl === 'string' &&
    (params.receiptUrl.startsWith('data:image/') || params.receiptUrl.startsWith('https://')) &&
    params.receiptUrl.length <= 2_800_000
      ? params.receiptUrl
      : undefined;

  const now = Date.now();
  const order: BillingOrder = {
    id: `ord-${now}-${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId,
    userEmail: sanitizeText(params.userEmail, 120).toLowerCase(),
    userName: sanitizeText(params.userName, 80) || undefined,
    planCode: plan.code,
    currency,
    amountPaid,
    amountUzs: currency === 'UZS' ? plan.priceUzs : 0,
    amountUsd: currency === 'USD' ? plan.priceUsd : 0,
    paymentMethod,
    status: 'pending',
    receiptNote: sanitizeText(params.receiptNote, 400) || undefined,
    receiptUrl: safeReceiptUrl,
    createdAt: now,
  };

  await saveBillingOrder(order);
  return { success: true, order };
}

async function saveBillingOrder(order: BillingOrder): Promise<void> {
  const store = getBillingStore();
  store.orders.set(order.id, order);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO billing_orders
                (id, user_id, user_email, user_name, plan_code, currency, amount_paid, amount_uzs, amount_usd, payment_method, status, receipt_note, receipt_url, external_ref, created_at, confirmed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            order.id,
            order.userId,
            order.userEmail,
            order.userName || null,
            order.planCode,
            order.currency,
            order.amountPaid,
            order.amountUzs,
            order.amountUsd,
            order.paymentMethod,
            order.status,
            order.receiptNote || null,
            order.receiptUrl || null,
            order.externalRef || null,
            order.createdAt,
            order.confirmedAt || null,
          ],
        });
      } catch (err) {
        console.warn('Could not save billing order to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('billing_orders').upsert({
          id: order.id,
          user_id: order.userId,
          user_email: order.userEmail,
          user_name: order.userName || null,
          plan_code: order.planCode,
          currency: order.currency,
          amount_paid: order.amountPaid,
          amount_uzs: order.amountUzs,
          amount_usd: order.amountUsd,
          payment_method: order.paymentMethod,
          status: order.status,
          receipt_note: order.receiptNote || null,
          receipt_url: order.receiptUrl || null,
          external_ref: order.externalRef || null,
          created_at: order.createdAt,
          confirmed_at: order.confirmedAt || null,
        });
      } catch (err) {
        console.warn('Could not save billing order to Supabase:', err);
      }
    }
  }
}

/**
 * Lists recent purchase orders for an authenticated user.
 */
export async function listUserOrders(userId: string): Promise<BillingOrder[]> {
  const store = getBillingStore();
  const dbActive = hasPrimaryDatabase();
  const results = new Map<string, BillingOrder>();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM billing_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 25`,
          args: [userId],
        });
        for (const row of res.rows) {
          const o = rowToOrder(row);
          results.set(o.id, o);
          store.orders.set(o.id, o);
        }
      } catch (err) {
        console.warn('User orders Turso query failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('billing_orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(25);
        if (data) {
          for (const row of data) {
            const o = rowToOrder(row);
            results.set(o.id, o);
            store.orders.set(o.id, o);
          }
        }
      } catch (err) {
        console.warn('User orders Supabase query failed:', err);
      }
    }
  }

  const sourceList = dbActive ? Array.from(results.values()) : Array.from(store.orders.values());
  return sourceList.filter((o) => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

async function findOrderById(orderId: string): Promise<BillingOrder | null> {
  const store = getBillingStore();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM billing_orders WHERE id = ? LIMIT 1`,
          args: [orderId],
        });
        if (res.rows.length > 0) {
          const o = rowToOrder(res.rows[0]);
          store.orders.set(o.id, o);
          return o;
        }
      } catch (err) {
        console.warn('Billing order Turso lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('billing_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        if (data) {
          const o = rowToOrder(data);
          store.orders.set(o.id, o);
          return o;
        }
      } catch (err) {
        console.warn('Billing order Supabase lookup failed:', err);
      }
    }
  }

  return store.orders.get(orderId) || null;
}

/**
 * Confirms or rejects a pending billing order from /admin and unlocks Pro entitlements on approval.
 */
export async function reviewBillingOrder(params: {
  orderId: string;
  action: 'APPROVE' | 'REJECT';
  reviewerId: string;
}): Promise<{ success: boolean; order?: BillingOrder; entitlement?: UserEntitlement; error?: string }> {
  const order = await findOrderById(params.orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }
  if (order.status !== 'pending') {
    return { success: false, error: `Order has already been marked ${order.status}.` };
  }

  order.status = params.action === 'APPROVE' ? 'paid' : 'rejected';
  order.confirmedAt = Date.now();
  await saveBillingOrder(order);

  let entitlement: UserEntitlement | undefined;
  if (params.action === 'APPROVE') {
    const plan = getPlanSpec(order.planCode) || BILLING_PLANS[1];
    entitlement = await grantUserEntitlement({
      userId: order.userId,
      provider: 'standalone',
      planCode: plan.code,
      durationDays: plan.durationDays,
      dailyLimit: plan.dailyLimit,
      metadata: { orderId: order.id, approvedBy: params.reviewerId },
    });
  }

  return { success: true, order, entitlement };
}

/**
 * Marks a paid order refunded and revokes associated active Pro entitlements.
 */
export async function refundOrRevokeBillingOrder(params: {
  orderId: string;
  action: 'REFUND' | 'REVOKE';
  reviewerId: string;
}): Promise<{ success: boolean; order?: BillingOrder; error?: string }> {
  const order = await findOrderById(params.orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }
  if (order.status !== 'paid') {
    return { success: false, error: `Only paid orders can be refunded/revoked (current: ${order.status}).` };
  }

  const now = Date.now();
  order.status = 'refunded';
  order.confirmedAt = now;
  await saveBillingOrder(order);

  const activeEnts = await fetchUserEntitlements(order.userId);
  for (const ent of activeEnts) {
    if (
      ent.metadata?.orderId === order.id ||
      (ent.provider === 'standalone' && ent.planCode === order.planCode)
    ) {
      ent.status = 'revoked';
      ent.updatedAt = now;
      ent.metadata = { ...(ent.metadata || {}), revokedBy: params.reviewerId, reason: params.action };
      await saveEntitlement(ent);
    }
  }

  return { success: true, order };
}

/**
 * Idempotently marks an order paid via automated payment gateway webhook (Click / Payme / Lemon Squeezy).
 */
export async function completeExternalGatewayOrder(params: {
  orderId: string;
  externalRef: string;
  paymentMethod: PaymentMethod;
}): Promise<{ success: boolean; order?: BillingOrder; entitlement?: UserEntitlement; error?: string }> {
  const order = await findOrderById(params.orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }
  if (order.status === 'paid') {
    return { success: true, order };
  }
  if (order.status === 'refunded' || order.status === 'rejected') {
    return { success: false, error: `Cannot settle ${order.status} order.` };
  }

  order.status = 'paid';
  order.paymentMethod = params.paymentMethod;
  order.externalRef = sanitizeText(params.externalRef, 120);
  order.confirmedAt = Date.now();
  await saveBillingOrder(order);

  const plan = getPlanSpec(order.planCode) || BILLING_PLANS[1];
  const entitlement = await grantUserEntitlement({
    userId: order.userId,
    provider: 'standalone',
    planCode: plan.code,
    durationDays: plan.durationDays,
    dailyLimit: plan.dailyLimit,
    metadata: { orderId: order.id, externalRef: order.externalRef, gateway: params.paymentMethod },
  });

  return { success: true, order, entitlement };
}

/**
 * Generates a promo or B2B school voucher code from /admin.
 */
export async function createPromoVoucher(params: {
  code?: string;
  planCode?: PlanCode;
  durationDays?: number;
  maxUses?: number;
  cohortId?: string;
  expiresInDays?: number;
  createdBy: string;
}): Promise<PromoVoucher> {
  const plan = getPlanSpec(params.planCode || 'PRO_MONTHLY') || BILLING_PLANS[1];
  const rawCode = sanitizeText(params.code, 32).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const code =
    rawCode.length >= 4
      ? rawCode
      : `PRO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const now = Date.now();
  const voucher: PromoVoucher = {
    code,
    planCode: plan.code === 'FREE' ? 'PRO_MONTHLY' : plan.code,
    durationDays: Math.max(1, Math.min(365, Number(params.durationDays || plan.durationDays || 30))),
    dailyLimit: plan.dailyLimit || PRO_DAILY_LIMIT,
    maxUses: Math.max(1, Math.min(1000, Number(params.maxUses || 1))),
    usedCount: 0,
    cohortId: sanitizeText(params.cohortId, 80) || undefined,
    createdBy: params.createdBy,
    expiresAt: params.expiresInDays ? now + params.expiresInDays * 24 * 60 * 60 * 1000 : null,
    isActive: true,
    createdAt: now,
  };

  const store = getBillingStore();
  store.vouchers.set(voucher.code, voucher);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO promo_vouchers
                (code, plan_code, duration_days, daily_limit, max_uses, used_count, cohort_id, created_by, expires_at, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            voucher.code,
            voucher.planCode,
            voucher.durationDays,
            voucher.dailyLimit,
            voucher.maxUses,
            voucher.usedCount,
            voucher.cohortId || null,
            voucher.createdBy,
            voucher.expiresAt,
            voucher.isActive ? 1 : 0,
            voucher.createdAt,
          ],
        });
      } catch (err) {
        console.warn('Could not persist promo voucher to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('promo_vouchers').upsert({
          code: voucher.code,
          plan_code: voucher.planCode,
          duration_days: voucher.durationDays,
          daily_limit: voucher.dailyLimit,
          max_uses: voucher.maxUses,
          used_count: voucher.usedCount,
          cohort_id: voucher.cohortId || null,
          created_by: voucher.createdBy,
          expires_at: voucher.expiresAt,
          is_active: voucher.isActive,
          created_at: voucher.createdAt,
        });
      } catch (err) {
        console.warn('Could not persist promo voucher to Supabase:', err);
      }
    }
  }

  return voucher;
}

/**
 * Enables or disables an existing promo voucher code from /admin.
 */
export async function togglePromoVoucher(params: {
  code: string;
  isActive: boolean;
}): Promise<{ success: boolean; voucher?: PromoVoucher; error?: string }> {
  const cleanCode = sanitizeText(params.code, 40).toUpperCase();
  const voucher = await findVoucherByCode(cleanCode);
  if (!voucher) {
    return { success: false, error: 'Voucher code not found.' };
  }

  voucher.isActive = Boolean(params.isActive);
  getBillingStore().vouchers.set(voucher.code, voucher);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        await turso.execute({
          sql: `UPDATE promo_vouchers SET is_active = ? WHERE code = ?`,
          args: [voucher.isActive ? 1 : 0, voucher.code],
        });
      } catch (err) {
        console.warn('Failed to toggle voucher in Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('promo_vouchers')
          .update({ is_active: voucher.isActive })
          .eq('code', voucher.code);
      } catch (err) {
        console.warn('Failed to toggle voucher in Supabase:', err);
      }
    }
  }

  return { success: true, voucher };
}

/**
 * Returns unbounded revenue KPIs and paginated orders/vouchers for the Admin dashboard.
 */
export async function getAdminBillingOverview(options?: {
  ordersLimit?: number;
  ordersOffset?: number;
  statusFilter?: BillingOrderStatus | 'all';
  vouchersLimit?: number;
  vouchersOffset?: number;
}): Promise<AdminBillingOverview> {
  const ordersLimit = Math.min(Math.max(1, options?.ordersLimit || 50), 200);
  const ordersOffset = Math.max(0, options?.ordersOffset || 0);
  const statusFilter = options?.statusFilter && options.statusFilter !== 'all' ? options.statusFilter : null;
  const vouchersLimit = Math.min(Math.max(1, options?.vouchersLimit || 50), 200);
  const vouchersOffset = Math.max(0, options?.vouchersOffset || 0);

  const store = getBillingStore();
  const now = Date.now();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoBillingTables(turso);
        const whereSql = statusFilter ? `WHERE status = ?` : '';
        const orderArgs = statusFilter ? [statusFilter, ordersLimit, ordersOffset] : [ordersLimit, ordersOffset];

        const [aggRes, pendingRes, entRes, ordRes, vouCountRes, vouRes] = await Promise.all([
          turso.execute(`
            SELECT
              COUNT(*) as total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' AND (currency = 'UZS' OR (currency IS NULL AND amount_uzs > 0)) THEN COALESCE(NULLIF(amount_paid, 0), amount_uzs) ELSE 0 END), 0) as rev_uzs,
              COALESCE(SUM(CASE WHEN status = 'paid' AND currency = 'USD' THEN COALESCE(NULLIF(amount_paid, 0), amount_usd) ELSE 0 END), 0) as rev_usd
            FROM billing_orders
          `),
          turso.execute(`SELECT COUNT(*) as pending_count FROM billing_orders WHERE status = 'pending'`),
          turso.execute({
            sql: `SELECT COUNT(*) as active_count FROM user_entitlements WHERE status = 'active' AND (expires_at IS NULL OR expires_at > ?)`,
            args: [now],
          }),
          turso.execute({
            sql: `SELECT * FROM billing_orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            args: orderArgs,
          }),
          turso.execute(`SELECT COUNT(*) as total_vouchers FROM promo_vouchers`),
          turso.execute({
            sql: `SELECT * FROM promo_vouchers ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            args: [vouchersLimit, vouchersOffset],
          }),
        ]);

        const orders = ordRes.rows.map(rowToOrder);
        const vouchers = vouRes.rows.map(rowToVoucher);
        return {
          totalRevenueUzs: Number(aggRes.rows[0]?.rev_uzs || 0),
          totalRevenueUsd: Number(aggRes.rows[0]?.rev_usd || 0),
          pendingOrdersCount: Number(pendingRes.rows[0]?.pending_count || 0),
          activeEntitlementsCount: Number(entRes.rows[0]?.active_count || 0),
          totalOrdersCount: Number(aggRes.rows[0]?.total_orders || orders.length),
          totalVouchersCount: Number(vouCountRes.rows[0]?.total_vouchers || vouchers.length),
          orders,
          vouchers,
        };
      } catch (err) {
        console.warn('Admin billing Turso overview failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        let ordersQuery = supabase
          .from('billing_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(ordersOffset, ordersOffset + ordersLimit - 1);
        if (statusFilter) {
          ordersQuery = ordersQuery.eq('status', statusFilter);
        }

        const [{ data: allPaid }, { count: totalOrders }, { count: pendingOrders }, { count: totalVouchers }, { data: entRows }, { data: pagedOrders }, { data: pagedVouchers }] =
          await Promise.all([
            supabase
              .from('billing_orders')
              .select('currency, amount_paid, amount_uzs, amount_usd')
              .eq('status', 'paid'),
            supabase.from('billing_orders').select('*', { count: 'exact', head: true }),
            supabase.from('billing_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('promo_vouchers').select('*', { count: 'exact', head: true }),
            supabase.from('user_entitlements').select('id, expires_at').eq('status', 'active'),
            ordersQuery,
            supabase
              .from('promo_vouchers')
              .select('*')
              .order('created_at', { ascending: false })
              .range(vouchersOffset, vouchersOffset + vouchersLimit - 1),
          ]);

        let revUzs = 0;
        let revUsd = 0;
        for (const r of (allPaid || []) as any[]) {
          const ord = rowToOrder({ ...r, id: '', user_id: '', user_email: '', plan_code: 'PRO_MONTHLY', payment_method: 'card_p2p', status: 'paid' });
          if (ord.currency === 'USD') {
            revUsd += ord.amountPaid;
          } else {
            revUzs += ord.amountPaid;
          }
        }

        const activeEntitlementsCount = (entRows || []).filter(
          (e: any) => e.expires_at === null || Number(e.expires_at) > now
        ).length;

        return {
          totalRevenueUzs: revUzs,
          totalRevenueUsd: revUsd,
          pendingOrdersCount: Number(pendingOrders || 0),
          activeEntitlementsCount,
          totalOrdersCount: Number(totalOrders || 0),
          totalVouchersCount: Number(totalVouchers || 0),
          orders: (pagedOrders || []).map(rowToOrder),
          vouchers: (pagedVouchers || []).map(rowToVoucher),
        };
      } catch (err) {
        console.warn('Admin billing Supabase overview failed:', err);
      }
    }
  }

  const allOrders = Array.from(store.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  const allVouchers = Array.from(store.vouchers.values()).sort((a, b) => b.createdAt - a.createdAt);
  const activeEntitlements = Array.from(store.entitlements.values()).filter(
    (e) => e.status === 'active' && (e.expiresAt === null || e.expiresAt > now)
  );
  const paidOrders = allOrders.filter((o) => o.status === 'paid');
  const filteredOrders = statusFilter ? allOrders.filter((o) => o.status === statusFilter) : allOrders;

  return {
    totalRevenueUzs: paidOrders
      .filter((o) => o.currency === 'UZS')
      .reduce((acc, o) => acc + o.amountPaid, 0),
    totalRevenueUsd: paidOrders
      .filter((o) => o.currency === 'USD')
      .reduce((acc, o) => acc + o.amountPaid, 0),
    pendingOrdersCount: allOrders.filter((o) => o.status === 'pending').length,
    activeEntitlementsCount: activeEntitlements.length,
    totalOrdersCount: allOrders.length,
    totalVouchersCount: allVouchers.length,
    orders: filteredOrders.slice(ordersOffset, ordersOffset + ordersLimit),
    vouchers: allVouchers.slice(vouchersOffset, vouchersOffset + vouchersLimit),
  };
}

/**
 * Returns the billing status bundle for the client workspace/upgrade modal.
 */
export async function getBillingStatusSummary(params: {
  identifier: string;
  userId?: string;
  role?: SessionRole;
}): Promise<BillingStatusSummary> {
  const resolved = await resolveEffectivePlan(params.userId, params.role);
  const quota = await getDailyQuotaSnapshot(params.identifier, params.userId, params.role);
  const recentOrders = params.userId && !params.userId.startsWith('user-')
    ? await listUserOrders(params.userId)
    : [];

  return {
    plans: BILLING_PLANS,
    p2pPaymentInfo: getP2PPaymentInfo(),
    activeEntitlement: resolved.entitlement,
    quota,
    recentOrders,
  };
}

