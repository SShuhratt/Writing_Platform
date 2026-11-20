import { NextResponse } from 'next/server';
import { completeExternalGatewayOrder } from '@/lib/billing-repository';

/**
 * Payme.uz Merchant JSON-RPC webhook adapter.
 */
export async function POST(request: Request) {
  const merchantKey = (process.env.PAYME_MERCHANT_KEY || '').trim();
  if (!merchantKey) {
    return NextResponse.json(
      { error: { code: -32504, message: 'Payme merchant key is not configured.' } },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const expectedAuth = `Basic ${Buffer.from(`Paycom:${merchantKey}`).toString('base64')}`;
  if (authHeader !== expectedAuth) {
    return NextResponse.json({
      error: { code: -32504, message: 'Insufficient privilege to perform this method.' },
    });
  }

  try {
    const rpc = await request.json();
    const method = String(rpc?.method || '');
    const orderId = String(rpc?.params?.account?.order_id || '').trim();
    const paymeTxId = String(rpc?.params?.id || `payme-${Date.now()}`);

    if (method === 'PerformTransaction' && orderId) {
      const settled = await completeExternalGatewayOrder({
        orderId,
        externalRef: paymeTxId,
        paymentMethod: 'payme',
      });
      if (!settled.success) {
        return NextResponse.json({
          id: rpc?.id || null,
          error: { code: -31050, message: settled.error || 'Order not found' },
        });
      }
      return NextResponse.json({
        id: rpc?.id || null,
        result: {
          transaction: orderId,
          perform_time: Date.now(),
          state: 2,
        },
      });
    }

    return NextResponse.json({
      id: rpc?.id || null,
      result: { allow: true },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: -32400, message: err?.message || 'Invalid JSON-RPC payload' } },
      { status: 500 }
    );
  }
}

