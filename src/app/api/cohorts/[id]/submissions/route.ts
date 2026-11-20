import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyTeacherOrAdminRequest } from '@/lib/server-auth';
import { saveTeacherFeedback } from '@/lib/b2b-repository';

/**
 * Saves instructor coaching feedback on a student submission within a cohort.
 */
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const staff = verifyTeacherOrAdminRequest(request);
  if (!staff) {
    return NextResponse.json(
      { success: false, error: 'Instructor or administrator authentication required.' },
      { status: 401 }
    );
  }

  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 30,
    windowMs: 60 * 1000,
    prefix: 'cohort_feedback',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const cohortId = context?.params?.id ? String(context.params.id).trim() : '';
    const body = await request.json();
    const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
    const feedback = typeof body?.feedback === 'string' ? body.feedback.trim() : '';

    if (!cohortId || !reportId) {
      return NextResponse.json(
        { success: false, error: 'Cohort ID and reportId are required' },
        { status: 400 }
      );
    }

    const result = await saveTeacherFeedback({
      cohortId,
      reportId,
      feedback,
      requesterId: staff.userId,
      isAdmin: staff.role === 'admin',
    });

    if (result.status === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Submission record not found in this cohort' },
        { status: 404 }
      );
    }
    if (result.status === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to review this cohort.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, submission: result.submission });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save teacher feedback' },
      { status: 500 }
    );
  }
}

