import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  return handleVerification(request);
}

export async function POST(request: NextRequest) {
  return handleVerification(request);
}

function handleVerification(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  const cookieToken = request.cookies.get('ielts_admin_token')?.value;
  const token = bearerToken || cookieToken;

  const adminPayload = verifyAdminToken(token);

  if (!adminPayload) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Invalid, missing, or expired admin session token',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: adminPayload.userId,
      username: adminPayload.username,
      role: 'admin',
    },
  });
}

