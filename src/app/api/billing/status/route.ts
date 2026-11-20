import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { getBillingStatusSummary } from '@/lib/billing-repository';
import { resolveQuotaIdentifier } from '@/lib/quota-service';

/**
 * Returns the active subscription plan, remaining UTC daily evaluation quota, and recent orders.
 */
export async function GET(request: Request) {
  const rateLimit = await checkRateLimitAsync(request, {
    limit: 60,
    windowMs: 60 * 1000,
    prefix: 'billing_status',
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const authUser = verifyAuthenticatedRequest(request);
    const identifier = resolveQuotaIdentifier(request, authUser?.userId);
    const summary = await getBillingStatusSummary({
      identifier,
      userId: authUser?.userId,
      role: authUser?.role,
    });

    return NextResponse.json({
      success: true,
      authenticated: Boolean(authUser),
      ...summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load billing status' },
      { status: 500 }
    );
  }
}

