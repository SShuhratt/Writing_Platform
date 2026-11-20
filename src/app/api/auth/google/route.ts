import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { upsertGoogleStudentAccount } from '@/lib/account-repository';
import { signSessionToken } from '@/lib/server-auth';

/**
 * Verifies a Google Identity Services ID token server-side and issues a signed session token.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: 'auth_google',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const credential = typeof body?.credential === 'string' ? body.credential.trim() : '';

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Google ID token credential is required.' },
        { status: 400 }
      );
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: 'no-store' }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Google credential verification failed.' },
        { status: 401 }
      );
    }

    const tokenInfo = await verifyRes.json();
    const expectedClientId =
      process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (expectedClientId && tokenInfo.aud !== expectedClientId) {
      return NextResponse.json(
        { success: false, error: 'Google token audience mismatch.' },
        { status: 401 }
      );
    }

    if (
      !tokenInfo?.email ||
      (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true)
    ) {
      return NextResponse.json(
        { success: false, error: 'Google account email is not verified.' },
        { status: 401 }
      );
    }

    const user = await upsertGoogleStudentAccount({
      email: String(tokenInfo.email),
      fullName: String(tokenInfo.name || tokenInfo.email.split('@')[0]),
      googleSub: tokenInfo.sub ? String(tokenInfo.sub) : undefined,
    });

    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      authProvider: 'google',
      role: 'user',
    });

    const response = NextResponse.json({
      success: true,
      user,
      token,
    });

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
      { success: false, error: err?.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}

