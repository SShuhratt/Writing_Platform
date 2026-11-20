import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyStudentEmailToken } from '@/lib/account-repository';

/**
 * Confirms an email verification token issued during registration.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: 'auth_verify_email',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const result = await verifyStudentEmailToken(token);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Email verification failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Email verification error' },
      { status: 500 }
    );
  }
}

