import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { createBillingOrder, listUserOrders } from '@/lib/billing-repository';
import { findStudentAccountById } from '@/lib/account-repository';
import { notifyAdminNewBillingOrder } from '@/lib/notifications';
import { BillingCurrency, PaymentMethod, PlanCode } from '@/types/billing';

/**
 * Lists recent standalone Pro plan purchase orders for the signed-in user.
 */
export async function GET(request: Request) {
  const authUser = verifyAuthenticatedRequest(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const orders = await listUserOrders(authUser.userId);
  return NextResponse.json({ success: true, orders });
}

/**
 * Submits a standalone Pro subscription purchase order (P2P card transfer receipt or gateway checkout).
 */
export async function POST(request: Request) {
  const rateLimit = await checkRateLimitAsync(request, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: 'billing_order',
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const authUser = verifyAuthenticatedRequest(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Please sign in before creating an upgrade order.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const planCode = String(body?.planCode || 'PRO_MONTHLY') as PlanCode;
    const paymentMethod = String(body?.paymentMethod || 'card_p2p') as PaymentMethod;
    const currency: BillingCurrency = body?.currency === 'USD' ? 'USD' : 'UZS';
    const receiptNote = typeof body?.receiptNote === 'string' ? body.receiptNote : '';
    const receiptUrl = typeof body?.receiptUrl === 'string' ? body.receiptUrl : undefined;

    const studentAccount =
      authUser.role === 'user' ? await findStudentAccountById(authUser.userId) : null;
    const userEmail =
      studentAccount?.email ||
      (typeof body?.userEmail === 'string' && body.userEmail.includes('@')
        ? body.userEmail
        : `${authUser.username}@student.local`);

    if (paymentMethod === 'card_p2p' && receiptNote.trim().length < 4 && !receiptUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter the transfer reference, card last 4 digits, or attach a receipt screenshot.',
        },
        { status: 400 }
      );
    }

    const res = await createBillingOrder({
      userId: authUser.userId,
      userEmail,
      userName: studentAccount?.fullName || authUser.fullName || authUser.username,
      planCode,
      currency,
      paymentMethod,
      receiptNote,
      receiptUrl,
    });

    if (!res.success || !res.order) {
      return NextResponse.json(
        {
          success: false,
          error: res.error || 'Could not create order',
          ...(res.order ? { existingOrder: res.order } : {}),
        },
        { status: res.order ? 409 : 400 }
      );
    }

    // Fire non-blocking admin Telegram notification when configured
    void notifyAdminNewBillingOrder(res.order);

    return NextResponse.json({ success: true, order: res.order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}

