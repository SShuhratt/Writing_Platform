import { NextResponse } from 'next/server';

const COOKIE_NAMES = ['ielts_session_token', 'ielts_admin_token', 'ielts_teacher_token'];

/**
 * Clears all server-issued HttpOnly session cookies cleanly on logout.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}

