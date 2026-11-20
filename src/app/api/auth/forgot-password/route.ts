import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { createPasswordResetToken } from '@/lib/account-repository';
import { getCanonicalSiteOrigin, sendTransactionalEmail } from '@/lib/notifications';

/**
 * Issues a time-limited password reset link without leaking whether an email exists.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 5,
    windowMs: 60 * 1000,
    prefix: 'auth_forgot_password',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const res = await createPasswordResetToken(email);
    if (res.issued && res.rawToken && res.user) {
      const resetUrl = `${getCanonicalSiteOrigin()}/workspace?resetToken=${encodeURIComponent(
        res.rawToken
      )}`;
      await sendTransactionalEmail({
        to: res.user.email,
        subject: 'Reset your IELTS Mentor AI password',
        text: `Reset your IELTS Mentor AI password using this link (expires in 30 minutes):\n\n${resetUrl}\n\nReset code: ${res.rawToken}\n\nIf you did not request this, you can safely ignore this message.`,
        html: `<p>Click below to reset your IELTS Mentor AI password (valid for 30 minutes):</p><p><a href="${resetUrl}">Reset Password</a></p><p>Or paste this reset code in the Reset Password dialog: <code>${res.rawToken}</code></p>`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        'If an account exists for that email address, password reset instructions have been sent.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to initiate password reset' },
      { status: 500 }
    );
  }
}

