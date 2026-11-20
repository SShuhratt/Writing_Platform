import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { findStudentAccountById } from '@/lib/account-repository';
import { joinCohortByCode } from '@/lib/b2b-repository';

/**
 * Allows an authenticated student account to enroll in a B2B cohort using its 6-character invite code.
 */
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 20,
    windowMs: 60 * 1000,
    prefix: 'cohort_join',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  const authUser = verifyAuthenticatedRequest(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Please sign in before joining a classroom cohort.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const joinCode = typeof body?.joinCode === 'string' ? body.joinCode.trim() : '';

    if (!joinCode) {
      return NextResponse.json(
        { success: false, error: 'A valid class invite code is required.' },
        { status: 400 }
      );
    }

    const account = authUser.role === 'user' ? await findStudentAccountById(authUser.userId) : null;
    const studentName = account?.fullName || authUser.fullName || authUser.username;
    const studentEmail =
      account?.email || (authUser.username.includes('@') ? authUser.username : undefined);

    const result = await joinCohortByCode({
      joinCode,
      studentId: authUser.userId,
      studentName: studentName || 'Student Candidate',
      studentEmail,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cohort: result.cohort,
      membership: result.membership,
      assignments: result.assignments || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to join cohort' },
      { status: 500 }
    );
  }
}

