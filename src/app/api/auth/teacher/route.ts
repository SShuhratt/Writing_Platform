import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { signSessionToken, verifyTeacherOrAdminRequest } from '@/lib/server-auth';
import { authenticateOrRegisterTeacher } from '@/lib/b2b-repository';

/**
 * Verifies an active teacher or admin session token from Bearer header or HttpOnly session cookie.
 */
export async function GET(request: Request) {
  const verified = verifyTeacherOrAdminRequest(request);
  if (!verified) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: verified.userId,
      username: verified.username,
      fullName: verified.fullName || verified.username,
      schoolName: verified.schoolName,
      role: verified.role,
    },
  });
}

/**
 * Authenticates or registers a B2B School Teacher and sets an HMAC-SHA256 HttpOnly session cookie.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: 'auth_teacher',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const mode = body?.mode === 'REGISTER' ? 'REGISTER' : 'LOGIN';

    const result = await authenticateOrRegisterTeacher({
      mode,
      email: body?.email || '',
      password: body?.password || '',
      fullName: body?.fullName,
      schoolName: body?.schoolName,
      accessCode: body?.accessCode,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: mode === 'LOGIN' ? 401 : 400 }
      );
    }

    const token = signSessionToken({
      userId: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      schoolName: result.user.schoolName,
      role: 'teacher',
    });

    const response = NextResponse.json({
      success: true,
      user: result.user,
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
      { success: false, error: err?.message || 'Failed to authenticate instructor' },
      { status: 500 }
    );
  }
}

