import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { completeExternalGatewayOrder } from '@/lib/billing-repository';

/**
 * Lemon Squeezy webhook handler (x-signature HMAC-SHA256 verification).
 */
export async function POST(request: Request) {
  const secret = (process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Lemon Squeezy webhook secret is not configured.' },
      { status: 503 }
    );
  }

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-signature') || '';
    const expectedDigest = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (
      !signatureHeader ||
      signatureHeader.length !== expectedDigest.length ||
      !crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedDigest))
    ) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = String(payload?.meta?.event_name || '');
    const customOrderId = String(payload?.meta?.custom_data?.order_id || '').trim();
    const externalRef = String(payload?.data?.id || '').trim();

    if (eventName === 'order_created' && customOrderId) {
      const res = await completeExternalGatewayOrder({
        orderId: customOrderId,
        externalRef: externalRef || `ls-${Date.now()}`,
        paymentMethod: 'lemon_squeezy',
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}

