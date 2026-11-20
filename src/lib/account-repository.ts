import crypto from 'crypto';
import { getTursoClient, isTursoConfigured } from '@/lib/turso';
import { getServiceSupabase, isServiceSupabaseConfigured } from '@/lib/supabase';
import { hashPassword, verifyPassword } from '@/lib/password-hash';
import { sanitizeTargetBand } from '@/lib/security-sanitize';
import { User } from '@/types/auth';
import { TargetBand } from '@/types/ielts';

interface StudentAccountRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string | null;
  targetBand: TargetBand;
  authProvider: 'local' | 'google' | 'convomate';
  emailVerified: boolean;
  googleSub?: string | null;
  createdAt: number;
}

interface AuthTokenRecord {
  tokenHash: string;
  userId: string;
  email: string;
  expiresAt: number;
  usedAt: number | null;
  createdAt: number;
}

const globalForAccounts = globalThis as unknown as {
  __ieltsStudentAccounts?: Map<string, StudentAccountRecord>;
  __ieltsResetTokens?: Map<string, AuthTokenRecord>;
  __ieltsVerifyTokens?: Map<string, AuthTokenRecord>;
  __ieltsStudentTableReady?: boolean;
};

function getAccountStore(): Map<string, StudentAccountRecord> {
  if (!globalForAccounts.__ieltsStudentAccounts) {
    globalForAccounts.__ieltsStudentAccounts = new Map();
  }
  return globalForAccounts.__ieltsStudentAccounts;
}

function getResetTokenStore(): Map<string, AuthTokenRecord> {
  if (!globalForAccounts.__ieltsResetTokens) {
    globalForAccounts.__ieltsResetTokens = new Map();
  }
  return globalForAccounts.__ieltsResetTokens;
}

function getVerifyTokenStore(): Map<string, AuthTokenRecord> {
  if (!globalForAccounts.__ieltsVerifyTokens) {
    globalForAccounts.__ieltsVerifyTokens = new Map();
  }
  return globalForAccounts.__ieltsVerifyTokens;
}

function getServerSupabase() {
  return getServiceSupabase();
}

function hashTokenValue(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen).trim();
}

export function deriveStudentIdFromEmail(email: string): string {
  const digest = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 12);
  return `stu-${digest}`;
}

function toPublicUser(record: StudentAccountRecord): User {
  return {
    id: record.id,
    username: record.email.split('@')[0] || 'student',
    email: record.email,
    fullName: record.fullName,
    role: 'user',
    targetBand: sanitizeTargetBand(record.targetBand),
    authProvider: record.authProvider,
    emailVerified: Boolean(record.emailVerified),
    createdAt: record.createdAt,
  };
}

async function ensureTursoStudentTable(turso: any): Promise<void> {
  if (globalForAccounts.__ieltsStudentTableReady) return;
  try {
    await turso.batch([
      `CREATE TABLE IF NOT EXISTS student_accounts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT,
        target_band TEXT NOT NULL DEFAULT '7.0',
        auth_provider TEXT NOT NULL DEFAULT 'local',
        email_verified INTEGER NOT NULL DEFAULT 0,
        google_sub TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS email_verification_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
    ]);

    const cols = await turso.execute(`PRAGMA table_info(student_accounts)`);
    const colNames = new Set(cols.rows.map((r: any) => String(r.name)));
    if (!colNames.has('email_verified')) {
      await turso.execute(`ALTER TABLE student_accounts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
    }
    if (!colNames.has('google_sub')) {
      await turso.execute(`ALTER TABLE student_accounts ADD COLUMN google_sub TEXT`);
    }
    globalForAccounts.__ieltsStudentTableReady = true;
  } catch (err) {
    console.warn('Could not initialize Turso student_accounts tables:', err);
  }
}

async function findAccountByEmail(email: string): Promise<StudentAccountRecord | null> {
  const store = getAccountStore();
  if (!isTursoConfigured() && !isServiceSupabaseConfigured()) {
    return store.get(email) || null;
  }

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM student_accounts WHERE email = ? LIMIT 1`,
          args: [email],
        });
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          const record: StudentAccountRecord = {
            id: String(row.id),
            email: String(row.email),
            fullName: String(row.full_name),
            passwordHash: row.password_hash ? String(row.password_hash) : null,
            targetBand: sanitizeTargetBand(row.target_band),
            authProvider: (String(row.auth_provider || 'local') as StudentAccountRecord['authProvider']),
            emailVerified: row.email_verified === true || Number(row.email_verified) === 1,
            googleSub: row.google_sub ? String(row.google_sub) : null,
            createdAt: Number(row.created_at || Date.now()),
          };
          store.set(email, record);
          return record;
        }
      } catch (err) {
        console.warn('Student account Turso lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('student_accounts')
          .select('*')
          .eq('email', email)
          .limit(1)
          .maybeSingle();

        if (data) {
          const record: StudentAccountRecord = {
            id: String(data.id),
            email: String(data.email),
            fullName: String(data.full_name),
            passwordHash: data.password_hash ? String(data.password_hash) : null,
            targetBand: sanitizeTargetBand(data.target_band),
            authProvider: (String(data.auth_provider || 'local') as StudentAccountRecord['authProvider']),
            emailVerified: Boolean(data.email_verified),
            googleSub: data.google_sub ? String(data.google_sub) : null,
            createdAt: Number(data.created_at || Date.now()),
          };
          store.set(email, record);
          return record;
        }
      } catch (err) {
        console.warn('Student account Supabase lookup failed:', err);
      }
    }
  }

  return store.get(email) || null;
}

export async function findStudentAccountById(userId: string): Promise<User | null> {
  const cleanId = sanitizeText(userId, 100);
  if (!cleanId) return null;

  const store = getAccountStore();
  if (!isTursoConfigured() && !isServiceSupabaseConfigured()) {
    const found = Array.from(store.values()).find((r) => r.id === cleanId);
    return found ? toPublicUser(found) : null;
  }

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM student_accounts WHERE id = ? LIMIT 1`,
          args: [cleanId],
        });
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          const record: StudentAccountRecord = {
            id: String(row.id),
            email: String(row.email),
            fullName: String(row.full_name),
            passwordHash: row.password_hash ? String(row.password_hash) : null,
            targetBand: sanitizeTargetBand(row.target_band),
            authProvider: (String(row.auth_provider || 'local') as StudentAccountRecord['authProvider']),
            emailVerified: row.email_verified === true || Number(row.email_verified) === 1,
            googleSub: row.google_sub ? String(row.google_sub) : null,
            createdAt: Number(row.created_at || Date.now()),
          };
          store.set(record.email, record);
          return toPublicUser(record);
        }
      } catch (err) {
        console.warn('Student account Turso ID lookup failed:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('student_accounts')
          .select('*')
          .eq('id', cleanId)
          .limit(1)
          .maybeSingle();

        if (data) {
          const record: StudentAccountRecord = {
            id: String(data.id),
            email: String(data.email),
            fullName: String(data.full_name),
            passwordHash: data.password_hash ? String(data.password_hash) : null,
            targetBand: sanitizeTargetBand(data.target_band),
            authProvider: (String(data.auth_provider || 'local') as StudentAccountRecord['authProvider']),
            emailVerified: Boolean(data.email_verified),
            googleSub: data.google_sub ? String(data.google_sub) : null,
            createdAt: Number(data.created_at || Date.now()),
          };
          store.set(record.email, record);
          return toPublicUser(record);
        }
      } catch (err) {
        console.warn('Student account Supabase ID lookup failed:', err);
      }
    }
  }

  const memMatch = Array.from(store.values()).find((r) => r.id === cleanId);
  return memMatch ? toPublicUser(memMatch) : null;
}

async function saveAccountRecord(record: StudentAccountRecord): Promise<void> {
  const store = getAccountStore();
  store.set(record.email, record);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO student_accounts (id, email, full_name, password_hash, target_band, auth_provider, email_verified, google_sub, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            record.id,
            record.email,
            record.fullName,
            record.passwordHash,
            record.targetBand,
            record.authProvider,
            record.emailVerified ? 1 : 0,
            record.googleSub || null,
            record.createdAt,
          ],
        });
      } catch (err) {
        console.warn('Could not persist student account to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('student_accounts').upsert({
          id: record.id,
          email: record.email,
          full_name: record.fullName,
          password_hash: record.passwordHash,
          target_band: record.targetBand,
          auth_provider: record.authProvider,
          email_verified: record.emailVerified,
          google_sub: record.googleSub || null,
          created_at: record.createdAt,
        });
      } catch (err) {
        console.warn('Could not persist student account to Supabase:', err);
      }
    }
  }
}

/**
 * Registers a standalone student account using salted scrypt password hashing.
 */
export async function registerStudentAccount(params: {
  fullName: string;
  email: string;
  password: string;
  targetBand?: TargetBand;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const email = sanitizeText(params.email, 120).toLowerCase();
  const fullName = sanitizeText(params.fullName, 80);
  const password = typeof params.password === 'string' ? params.password : '';
  const targetBand = sanitizeTargetBand(params.targetBand || '7.0');

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (!fullName || fullName.length < 2) {
    return { success: false, error: 'Please enter your full name.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const existing = await findAccountByEmail(email);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
  }

  const record: StudentAccountRecord = {
    id: deriveStudentIdFromEmail(email),
    email,
    fullName,
    passwordHash: hashPassword(password),
    targetBand,
    authProvider: 'local',
    emailVerified: false,
    googleSub: null,
    createdAt: Date.now(),
  };

  await saveAccountRecord(record);
  return { success: true, user: toPublicUser(record) };
}

/**
 * Authenticates a standalone student account against stored scrypt password hashes.
 */
export async function loginStudentAccount(params: {
  identifier: string;
  password: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const identifier = sanitizeText(params.identifier, 120).toLowerCase();
  const password = typeof params.password === 'string' ? params.password : '';

  if (!identifier || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const existing = await findAccountByEmail(identifier);
  if (!existing) {
    return {
      success: false,
      error: 'No student account found for that email. Please create an account first.',
    };
  }

  if (!existing.passwordHash) {
    return {
      success: false,
      error:
        'This account uses Google Sign-In. Please continue with Google, or use Forgot Password to set a local password.',
    };
  }

  if (!verifyPassword(password, existing.passwordHash)) {
    return { success: false, error: 'Incorrect email or password.' };
  }

  return { success: true, user: toPublicUser(existing) };
}

/**
 * Creates or retrieves a canonical student account authenticated via Google OAuth,
 * cleanly linking Google verification onto an existing local account when emails match.
 */
export async function upsertGoogleStudentAccount(params: {
  email: string;
  fullName: string;
  googleSub?: string;
  targetBand?: TargetBand;
}): Promise<User> {
  const email = sanitizeText(params.email, 120).toLowerCase();
  const fullName = sanitizeText(params.fullName, 80) || email.split('@')[0] || 'Student';
  const existing = await findAccountByEmail(email);

  if (existing) {
    let changed = false;
    if (!existing.emailVerified) {
      existing.emailVerified = true;
      changed = true;
    }
    if (params.googleSub && existing.googleSub !== params.googleSub) {
      existing.googleSub = params.googleSub;
      changed = true;
    }
    if (changed) {
      await saveAccountRecord(existing);
    }
    return toPublicUser(existing);
  }

  const record: StudentAccountRecord = {
    id: deriveStudentIdFromEmail(email),
    email,
    fullName,
    passwordHash: null,
    targetBand: sanitizeTargetBand(params.targetBand || '7.5'),
    authProvider: 'google',
    emailVerified: true,
    googleSub: params.googleSub || null,
    createdAt: Date.now(),
  };

  await saveAccountRecord(record);
  return toPublicUser(record);
}

/**
 * Issues a short-lived password reset token (stored hashed) for an existing student email.
 */
export async function createPasswordResetToken(emailInput: string): Promise<{
  issued: boolean;
  rawToken?: string;
  user?: User;
}> {
  const email = sanitizeText(emailInput, 120).toLowerCase();
  if (!email || !email.includes('@')) {
    return { issued: false };
  }

  const existing = await findAccountByEmail(email);
  if (!existing) {
    return { issued: false };
  }

  const rawToken = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashTokenValue(rawToken);
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000; // 30 minutes

  const tokenRecord: AuthTokenRecord = {
    tokenHash,
    userId: existing.id,
    email: existing.email,
    expiresAt,
    usedAt: null,
    createdAt: now,
  };

  getResetTokenStore().set(tokenHash, tokenRecord);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO password_reset_tokens (token_hash, user_id, email, expires_at, used_at, created_at)
                VALUES (?, ?, ?, ?, NULL, ?)`,
          args: [tokenHash, existing.id, existing.email, expiresAt, now],
        });
      } catch (err) {
        console.warn('Could not persist password reset token to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('password_reset_tokens').upsert({
          token_hash: tokenHash,
          user_id: existing.id,
          email: existing.email,
          expires_at: expiresAt,
          used_at: null,
          created_at: now,
        });
      } catch (err) {
        console.warn('Could not persist password reset token to Supabase:', err);
      }
    }
  }

  return { issued: true, rawToken, user: toPublicUser(existing) };
}

/**
 * Validates and consumes a password reset token and updates the user's scrypt password hash.
 */
export async function consumePasswordResetToken(params: {
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const rawToken = typeof params.token === 'string' ? params.token.trim() : '';
  const newPassword = typeof params.newPassword === 'string' ? params.newPassword : '';

  if (!rawToken || rawToken.length < 16) {
    return { success: false, error: 'Invalid or missing password reset token.' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const tokenHash = hashTokenValue(rawToken);
  let record: AuthTokenRecord | null = getResetTokenStore().get(tokenHash) || null;

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`,
          args: [tokenHash],
        });
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          record = {
            tokenHash: String(row.token_hash),
            userId: String(row.user_id),
            email: String(row.email),
            expiresAt: Number(row.expires_at),
            usedAt: row.used_at ? Number(row.used_at) : null,
            createdAt: Number(row.created_at),
          };
        }
      } catch (err) {
        console.warn('Password reset Turso lookup failed:', err);
      }
    }
  }

  if (!record && isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('password_reset_tokens')
          .select('*')
          .eq('token_hash', tokenHash)
          .maybeSingle();
        if (data) {
          record = {
            tokenHash: String(data.token_hash),
            userId: String(data.user_id),
            email: String(data.email),
            expiresAt: Number(data.expires_at),
            usedAt: data.used_at ? Number(data.used_at) : null,
            createdAt: Number(data.created_at),
          };
        }
      } catch (err) {
        console.warn('Password reset Supabase lookup failed:', err);
      }
    }
  }

  if (!record || record.usedAt) {
    return { success: false, error: 'Reset link has already been used or is invalid.' };
  }
  if (Date.now() > record.expiresAt) {
    return { success: false, error: 'Reset link has expired. Please request a new one.' };
  }

  const account = await findAccountByEmail(record.email);
  if (!account) {
    return { success: false, error: 'Associated student account could not be found.' };
  }

  account.passwordHash = hashPassword(newPassword);
  account.emailVerified = true;
  await saveAccountRecord(account);

  const now = Date.now();
  record.usedAt = now;
  getResetTokenStore().set(tokenHash, record);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await turso.execute({
          sql: `UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?`,
          args: [now, tokenHash],
        });
      } catch (err) {
        console.warn('Failed to mark Turso reset token used:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('password_reset_tokens')
          .update({ used_at: now })
          .eq('token_hash', tokenHash);
      } catch (err) {
        console.warn('Failed to mark Supabase reset token used:', err);
      }
    }
  }

  return { success: true };
}

/**
 * Issues an email verification token (stored hashed) valid for 24 hours.
 */
export async function createEmailVerificationToken(userId: string, emailInput: string): Promise<string> {
  const email = sanitizeText(emailInput, 120).toLowerCase();
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashTokenValue(rawToken);
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000;

  const tokenRecord: AuthTokenRecord = {
    tokenHash,
    userId,
    email,
    expiresAt,
    usedAt: null,
    createdAt: now,
  };
  getVerifyTokenStore().set(tokenHash, tokenRecord);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO email_verification_tokens (token_hash, user_id, email, expires_at, used_at, created_at)
                VALUES (?, ?, ?, ?, NULL, ?)`,
          args: [tokenHash, userId, email, expiresAt, now],
        });
      } catch (err) {
        console.warn('Failed to persist email verification token to Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('email_verification_tokens').upsert({
          token_hash: tokenHash,
          user_id: userId,
          email,
          expires_at: expiresAt,
          used_at: null,
          created_at: now,
        });
      } catch (err) {
        console.warn('Failed to persist email verification token to Supabase:', err);
      }
    }
  }

  return rawToken;
}

/**
 * Verifies an email verification token and marks the student account verified.
 */
export async function verifyStudentEmailToken(rawToken: string): Promise<{ success: boolean; error?: string }> {
  const clean = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!clean || clean.length < 16) {
    return { success: false, error: 'Invalid verification token.' };
  }

  const tokenHash = hashTokenValue(clean);
  let record: AuthTokenRecord | null = getVerifyTokenStore().get(tokenHash) || null;

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoStudentTable(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM email_verification_tokens WHERE token_hash = ? LIMIT 1`,
          args: [tokenHash],
        });
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          record = {
            tokenHash: String(row.token_hash),
            userId: String(row.user_id),
            email: String(row.email),
            expiresAt: Number(row.expires_at),
            usedAt: row.used_at ? Number(row.used_at) : null,
            createdAt: Number(row.created_at),
          };
        }
      } catch (err) {
        console.warn('Email verification Turso lookup failed:', err);
      }
    }
  }

  if (!record && isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('email_verification_tokens')
          .select('*')
          .eq('token_hash', tokenHash)
          .maybeSingle();
        if (data) {
          record = {
            tokenHash: String(data.token_hash),
            userId: String(data.user_id),
            email: String(data.email),
            expiresAt: Number(data.expires_at),
            usedAt: data.used_at ? Number(data.used_at) : null,
            createdAt: Number(data.created_at),
          };
        }
      } catch (err) {
        console.warn('Email verification Supabase lookup failed:', err);
      }
    }
  }

  if (!record || record.usedAt) {
    return { success: false, error: 'Verification link is invalid or already used.' };
  }
  if (Date.now() > record.expiresAt) {
    return { success: false, error: 'Verification link has expired.' };
  }

  const account = await findAccountByEmail(record.email);
  if (!account) {
    return { success: false, error: 'Account not found.' };
  }

  account.emailVerified = true;
  await saveAccountRecord(account);

  const now = Date.now();
  record.usedAt = now;
  getVerifyTokenStore().set(tokenHash, record);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await turso.execute({
          sql: `UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?`,
          args: [now, tokenHash],
        });
      } catch {}
    }
  }
  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('email_verification_tokens')
          .update({ used_at: now })
          .eq('token_hash', tokenHash);
      } catch {}
    }
  }

  return { success: true };
}

