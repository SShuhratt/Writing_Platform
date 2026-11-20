import { getClientIp } from './rate-limit';
import { SessionRole } from './server-auth';
import {
  consumeDailyEvaluationQuota,
  consumeDailyGuidanceQuota,
  FREE_DAILY_LIMIT,
  getDailyQuotaSnapshot,
} from './billing-repository';
import { QuotaSnapshot } from '@/types/billing';

export const DAILY_FREE_EVALUATION_LIMIT = FREE_DAILY_LIMIT;

export type QuotaCheckResult = QuotaSnapshot;

/**
 * Resolves a deterministic quota identifier anchored to the verified account ID when available,
 * falling back to client IP only for anonymous requests.
 */
export function resolveQuotaIdentifier(req: Request, userId?: string): string {
  if (
    userId &&
    !userId.startsWith('user-') &&
    !userId.startsWith('anonymous') &&
    !userId.startsWith('guest')
  ) {
    return `user:${userId}`;
  }
  return `ip:${getClientIp(req)}`;
}

/**
 * Checks the user's current plan allowance and records 1 consumed evaluation in persistent storage.
 */
export async function checkAndRecordEvaluationQuota(
  req: Request,
  userId?: string,
  role?: SessionRole | boolean
): Promise<QuotaCheckResult> {
  const identifier = resolveQuotaIdentifier(req, userId);
  const resolvedRole: SessionRole | undefined =
    typeof role === 'boolean' ? (role ? 'admin' : 'user') : role;

  return consumeDailyEvaluationQuota(identifier, userId, resolvedRole);
}

/**
 * Returns the remaining evaluation quota snapshot without consuming a credit.
 */
export async function getQuotaStatusForRequest(
  req: Request,
  userId?: string,
  role?: SessionRole
): Promise<QuotaSnapshot> {
  const identifier = resolveQuotaIdentifier(req, userId);
  return getDailyQuotaSnapshot(identifier, userId, role);
}

/**
 * Atomically checks and records 1 daily live Socratic guidance request.
 */
export async function checkAndRecordGuidanceQuota(
  req: Request,
  userId?: string,
  role?: SessionRole
): Promise<QuotaCheckResult> {
  const identifier = resolveQuotaIdentifier(req, userId);
  return consumeDailyGuidanceQuota(identifier, userId, role);
}
