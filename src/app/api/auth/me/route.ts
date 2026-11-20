import { NextResponse } from 'next/server';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { findStudentAccountById } from '@/lib/account-repository';

/**
 * Validates the active session token/cookie and returns authoritative user identity.
 */
export async function GET(request: Request) {
  const verified = verifyAuthenticatedRequest(request);
  if (!verified) {
    return NextResponse.json(
      { authenticated: false, error: 'Session expired or not signed in.' },
      { status: 401 }
    );
  }

  let email = verified.username.includes('@') ? verified.username : '';
  let targetBand = '7.0';
  let emailVerified = true;
  let fullName = verified.fullName || verified.username;

  if (verified.role === 'user') {
    const account = await findStudentAccountById(verified.userId);
    if (account) {
      email = account.email;
      targetBand = account.targetBand;
      emailVerified = Boolean(account.emailVerified);
      fullName = account.fullName;
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: verified.userId,
      username: verified.username,
      email,
      fullName,
      schoolName: verified.schoolName,
      role: verified.role,
      targetBand,
      authProvider: verified.authProvider || 'local',
      emailVerified,
      exp: verified.exp,
    },
  });
}

