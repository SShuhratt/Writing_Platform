import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { fetchUserSubmissions } from '@/lib/submission-repository';

/**
 * Returns persisted evaluation reports for the currently authenticated user (cross-device sync).
 */
export async function GET(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 40,
    windowMs: 60 * 1000,
    prefix: 'submissions_get',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  const authUser = verifyAuthenticatedRequest(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  try {
    const submissions = await fetchUserSubmissions(authUser.userId);
    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load submission history' },
      { status: 500 }
    );
  }
}

