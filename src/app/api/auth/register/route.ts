import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { createEmailVerificationToken, registerStudentAccount } from '@/lib/account-repository';
import { signSessionToken } from '@/lib/server-auth';
import { getCanonicalSiteOrigin, sendTransactionalEmail } from '@/lib/notifications';

/**
 * Registers a standalone student account in persistent storage and issues a signed session token.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 5,
    windowMs: 60 * 1000,
    prefix: 'auth_register',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const result = await registerStudentAccount({
      fullName: body?.fullName || '',
      email: body?.email || '',
      password: body?.password || '',
      targetBand: body?.targetBand,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed.' },
        { status: 400 }
      );
    }

    // Issue non-blocking email verification token
    try {
      const verifyToken = await createEmailVerificationToken(result.user.id, result.user.email);
      const verifyUrl = `${getCanonicalSiteOrigin()}/workspace?verifyEmailToken=${encodeURIComponent(
        verifyToken
      )}`;
      await sendTransactionalEmail({
        to: result.user.email,
        subject: 'Verify your IELTS Mentor AI email address',
        text: `Welcome to IELTS Mentor AI! Verify your email address here: ${verifyUrl}`,
        html: `<p>Welcome to <strong>IELTS Mentor AI</strong>!</p><p><a href="${verifyUrl}">Click here to verify your email address</a></p>`,
      });
    } catch (emailErr) {
      console.warn('Verification email dispatch warning (non-fatal):', emailErr);
    }

    const token = signSessionToken({
      userId: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      authProvider: 'local',
      role: 'user',
    });

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
        token,
      },
      { status: 201 }
    );

    response.cookies.set('ielts_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

