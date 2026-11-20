import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { signAdminToken, signSessionToken } from '@/lib/server-auth';
import { loginStudentAccount } from '@/lib/account-repository';
import { User } from '@/types/auth';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function setSessionCookie(response: NextResponse, cookieName: string, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

export async function POST(req: Request) {
  // 1. Rate Limiting Protection (5 login attempts / min to prevent brute-force attacks)
  const rateLimitResult = await checkRateLimitAsync(req, {
    limit: 5,
    windowMs: 60 * 1000,
    prefix: 'auth_login',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password);

    const isAdminConfigured = Boolean((ADMIN_USERNAME || ADMIN_EMAIL) && ADMIN_PASSWORD);
    const isAdminId =
      isAdminConfigured &&
      ((ADMIN_USERNAME && cleanId === ADMIN_USERNAME.toLowerCase()) ||
        (ADMIN_EMAIL && cleanId === ADMIN_EMAIL.toLowerCase()));

    // 2. Admin Verification (Server-Side Env Only)
    if (isAdminId) {
      if (cleanPass === ADMIN_PASSWORD) {
        const adminUser: User = {
          id: 'admin-root',
          username: ADMIN_USERNAME || 'admin',
          email: ADMIN_EMAIL || 'admin@ieltsmentor.ai',
          fullName: 'Platform Administrator',
          role: 'admin',
          targetBand: '9.0',
          authProvider: 'local',
          createdAt: Date.now(),
        };

        const adminToken = signAdminToken({
          userId: adminUser.id,
          username: adminUser.username,
          fullName: adminUser.fullName,
          authProvider: 'local',
          role: 'admin',
        });

        const response = NextResponse.json({
          success: true,
          user: adminUser,
          token: adminToken,
        });

        setSessionCookie(response, 'ielts_admin_token', adminToken);
        setSessionCookie(response, 'ielts_session_token', adminToken);
        return response;
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please verify your details.' },
        { status: 401 }
      );
    }

    // 3. Server-Backed Student Verification (scrypt password verification)
    const studentResult = await loginStudentAccount({
      identifier: cleanId,
      password: cleanPass,
    });

    if (!studentResult.success || !studentResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: studentResult.error || 'Invalid credentials. Please verify your details.',
        },
        { status: 401 }
      );
    }

    const sessionToken = signSessionToken({
      userId: studentResult.user.id,
      username: studentResult.user.username,
      fullName: studentResult.user.fullName,
      authProvider: studentResult.user.authProvider || 'local',
      role: 'user',
    });

    const response = NextResponse.json({
      success: true,
      user: studentResult.user,
      token: sessionToken,
    });
    setSessionCookie(response, 'ielts_session_token', sessionToken);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
