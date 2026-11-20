import { NextRequest, NextResponse } from 'next/server';
import { extractRequestToken, verifyAdminToken } from '@/lib/server-auth';
import {
  createPromoVoucher,
  getAdminBillingOverview,
  refundOrRevokeBillingOrder,
  reviewBillingOrder,
  togglePromoVoucher,
} from '@/lib/billing-repository';
import { BillingOrderStatus, PlanCode } from '@/types/billing';

function authenticateAdmin(request: NextRequest) {
  const token =
    extractRequestToken(request) || request.cookies.get('ielts_admin_token')?.value || null;
  return verifyAdminToken(token);
}

/**
 * Returns unbounded revenue KPIs and paginated orders/vouchers for /admin.
 */
export async function GET(request: NextRequest) {
  const admin = authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const ordersLimit = Number(searchParams.get('limit') || '50');
    const ordersOffset = Number(searchParams.get('offset') || '0');
    const statusParam = searchParams.get('status') || 'all';
    const statusFilter = (
      ['pending', 'paid', 'rejected', 'refunded', 'all'].includes(statusParam)
        ? statusParam
        : 'all'
    ) as BillingOrderStatus | 'all';

    const overview = await getAdminBillingOverview({
      ordersLimit: Number.isFinite(ordersLimit) ? ordersLimit : 50,
      ordersOffset: Number.isFinite(ordersOffset) ? ordersOffset : 0,
      statusFilter,
    });
    return NextResponse.json({ success: true, ...overview });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load billing overview' },
      { status: 500 }
    );
  }
}

/**
 * Creates a new promo or B2B school voucher code.
 */
export async function POST(request: NextRequest) {
  const admin = authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const voucher = await createPromoVoucher({
      code: body?.code,
      planCode: (body?.planCode || 'PRO_MONTHLY') as PlanCode,
      durationDays: body?.durationDays ? Number(body.durationDays) : undefined,
      maxUses: body?.maxUses ? Number(body.maxUses) : 1,
      cohortId: body?.cohortId,
      expiresInDays: body?.expiresInDays ? Number(body.expiresInDays) : undefined,
      createdBy: admin.username,
    });

    return NextResponse.json({ success: true, voucher }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create voucher' },
      { status: 500 }
    );
  }
}

/**
 * Handles admin lifecycle actions: APPROVE / REJECT / REFUND_ORDER / REVOKE_ORDER / TOGGLE_VOUCHER.
 */
export async function PATCH(request: NextRequest) {
  const admin = authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const action = String(body?.action || '').toUpperCase();

    if (action === 'TOGGLE_VOUCHER') {
      const code = typeof body?.code === 'string' ? body.code.trim() : '';
      const isActive = Boolean(body?.isActive);
      if (!code) {
        return NextResponse.json({ success: false, error: 'Voucher code is required.' }, { status: 400 });
      }
      const res = await togglePromoVoucher({ code, isActive });
      if (!res.success || !res.voucher) {
        return NextResponse.json({ success: false, error: res.error || 'Voucher not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, voucher: res.voucher });
    }

    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required.' },
        { status: 400 }
      );
    }

    if (action === 'REFUND_ORDER' || action === 'REVOKE_ORDER') {
      const res = await refundOrRevokeBillingOrder({
        orderId,
        action: action === 'REFUND_ORDER' ? 'REFUND' : 'REVOKE',
        reviewerId: admin.username,
      });
      if (!res.success || !res.order) {
        return NextResponse.json(
          { success: false, error: res.error || 'Could not update order.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    const reviewAction = action === 'REJECT' ? 'REJECT' : 'APPROVE';
    const res = await reviewBillingOrder({
      orderId,
      action: reviewAction,
      reviewerId: admin.username,
    });

    if (!res.success || !res.order) {
      return NextResponse.json(
        { success: false, error: res.error || 'Could not update order status.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: res.order,
      entitlement: res.entitlement,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update billing record' },
      { status: 500 }
    );
  }
}

