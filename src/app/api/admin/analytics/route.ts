import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/server-auth';
import { fetchLiveAdminAnalytics } from '@/lib/submission-repository';

export async function GET(request: NextRequest) {
  // 1. Authenticate that caller is a verified Admin
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  const cookieToken = request.cookies.get('ielts_admin_token')?.value;
  const token = bearerToken || cookieToken;

  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 401 }
    );
  }

  try {
    const analyticsData = await fetchLiveAdminAnalytics();
    return NextResponse.json({
      success: true,
      ...analyticsData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  }
}

