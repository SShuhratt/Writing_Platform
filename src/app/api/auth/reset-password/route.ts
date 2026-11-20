import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { consumePasswordResetToken } from '@/lib/account-repository';

/**
 * Verifies a password reset token and updates the user's password hash.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 6,
    windowMs: 60 * 1000,
    prefix: 'auth_reset_password',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    const result = await consumePasswordResetToken({ token, newPassword });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Password reset failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}

