import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { completeExternalGatewayOrder } from '@/lib/billing-repository';

/**
 * Click.uz merchant callback adapter (MD5/HMAC signature verification).
 */
export async function POST(request: Request) {
  const secretKey = (process.env.CLICK_SECRET_KEY || '').trim();
  if (!secretKey) {
    return NextResponse.json(
      { error: -9, error_note: 'Click gateway secret key is not configured.' },
      { status: 503 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const params: Record<string, string> = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries(new URLSearchParams(await request.text()).entries());

    const {
      click_trans_id = '',
      service_id = '',
      merchant_trans_id = '',
      merchant_prepare_id = '',
      amount = '',
      action = '',
      sign_time = '',
      sign_string = '',
      error = '0',
    } = params;

    const signBase =
      action === '1'
        ? `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`
        : `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`;
    const expectedSign = crypto.createHash('md5').update(signBase).digest('hex');

    if (expectedSign !== sign_string) {
      return NextResponse.json({ error: -1, error_note: 'SIGN CHECK FAILED!' });
    }

    if (action === '1' && Number(error) === 0 && merchant_trans_id) {
      const settled = await completeExternalGatewayOrder({
        orderId: merchant_trans_id,
        externalRef: `click-${click_trans_id}`,
        paymentMethod: 'click',
      });
      if (!settled.success) {
        return NextResponse.json({ error: -5, error_note: settled.error || 'Order not found' });
      }
    }

    return NextResponse.json({
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: merchant_trans_id,
      error: 0,
      error_note: 'Success',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: -8, error_note: err?.message || 'Internal Click callback error' },
      { status: 500 }
    );
  }
}

