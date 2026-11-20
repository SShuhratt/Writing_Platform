import crypto from 'crypto';

const DEV_FALLBACK_SECRET = 'ielts-dev-only-session-hmac-salt-key-2026';

export function getSigningSecret(): string | null {
  const configured =
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    '';

  if (configured.trim().length > 0) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return DEV_FALLBACK_SECRET;
}

export type StaffRole = 'teacher' | 'admin';
export type SessionRole = 'user' | StaffRole;

export interface AuthTokenPayload {
  userId: string;
  username: string;
  fullName?: string;
  schoolName?: string;
  authProvider?: 'local' | 'google' | 'convomate';
  role: SessionRole;
  exp: number; // Expiration timestamp in ms
}

export interface AdminTokenPayload extends AuthTokenPayload {
  role: 'admin';
}

/**
 * Creates an HMAC-SHA256 signed session token for student, teacher, or admin access.
 * Fails closed in production if ADMIN_SECRET / ADMIN_SESSION_SECRET / ADMIN_PASSWORD is unset.
 */
export function signSessionToken(
  payload: Omit<AuthTokenPayload, 'exp'>,
  expiresInMs = 24 * 60 * 60 * 1000
): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('Server session signing secret is not configured in production.');
  }

  const exp = Date.now() + expiresInMs;
  const data: AuthTokenPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedData)
    .digest('base64url');

  return `${encodedData}.${signature}`;
}

/**
 * Validates an HMAC-SHA256 signed session token against optional allowed roles.
 */
export function verifySessionToken(
  token: string | null | undefined,
  allowedRoles: SessionRole[] = ['user', 'teacher', 'admin']
): AuthTokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const secret = getSigningSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedData, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(encodedData)
    .digest('base64url');

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload: AuthTokenPayload = JSON.parse(
      Buffer.from(encodedData, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) {
      return null;
    }

    if (!allowedRoles.includes(payload.role)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates an HMAC-SHA256 signed admin session token.
 */
export function signAdminToken(
  payload: Omit<AdminTokenPayload, 'exp'>,
  expiresInMs = 24 * 60 * 60 * 1000
): string {
  return signSessionToken(payload, expiresInMs);
}

/**
 * Validates an HMAC-SHA256 signed admin session token.
 */
export function verifyAdminToken(token: string | null | undefined): AdminTokenPayload | null {
  const verified = verifySessionToken(token, ['admin']);
  return verified ? (verified as AdminTokenPayload) : null;
}

/**
 * Extracts a session token from the Authorization Bearer header or session cookies.
 */
export function extractRequestToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (bearerToken) return bearerToken;

  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch =
    cookieHeader.match(/ielts_session_token=([^;]+)/) ||
    cookieHeader.match(/ielts_admin_token=([^;]+)/);

  return sessionMatch ? decodeURIComponent(sessionMatch[1]) : null;
}

/**
 * Verifies that a Request holds a valid signed session for any authenticated user role.
 */
export function verifyAuthenticatedRequest(request: Request): AuthTokenPayload | null {
  const token = extractRequestToken(request);
  return verifySessionToken(token, ['user', 'teacher', 'admin']);
}

/**
 * Verifies that a Request is authenticated as either a Teacher or Platform Admin.
 */
export function verifyTeacherOrAdminRequest(request: Request): AuthTokenPayload | null {
  const token = extractRequestToken(request);
  return verifySessionToken(token, ['teacher', 'admin']);
}
