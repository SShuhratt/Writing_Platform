import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { getBillingStatusSummary, redeemPromoVoucher } from '@/lib/billing-repository';
import { resolveQuotaIdentifier } from '@/lib/quota-service';

/**
 * Redeems a promo or B2B school voucher code to activate IELTS Pro evaluation limits.
 */
export async function POST(request: Request) {
  const rateLimit = await checkRateLimitAsync(request, {
    limit: 12,
    windowMs: 60 * 1000,
    prefix: 'billing_redeem',
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const authUser = verifyAuthenticatedRequest(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Please sign in before redeeming a voucher code.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code : '';
    const result = await redeemPromoVoucher({
      code,
      userId: authUser.userId,
    });

    if (!result.success || !result.entitlement) {
      return NextResponse.json(
        { success: false, error: result.error || 'Could not redeem voucher code.' },
        { status: 400 }
      );
    }

    const summary = await getBillingStatusSummary({
      identifier: resolveQuotaIdentifier(request, authUser.userId),
      userId: authUser.userId,
      role: authUser.role,
    });

    return NextResponse.json({
      success: true,
      entitlement: result.entitlement,
      ...summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to redeem voucher code' },
      { status: 500 }
    );
  }
}

