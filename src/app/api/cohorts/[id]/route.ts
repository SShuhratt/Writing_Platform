import { NextResponse } from 'next/server';
import { verifyTeacherOrAdminRequest } from '@/lib/server-auth';
import { getCohortDetail } from '@/lib/b2b-repository';

/**
 * Fetches full roster, prompt assignments, and submission analytics for a cohort owned by the caller.
 */
export async function GET(
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

  const cohortId = context?.params?.id ? String(context.params.id).trim() : '';
  if (!cohortId) {
    return NextResponse.json({ success: false, error: 'Missing cohort ID' }, { status: 400 });
  }

  const res = await getCohortDetail(cohortId, staff.userId, staff.role === 'admin');

  if (res.status === 'NOT_FOUND') {
    return NextResponse.json({ success: false, error: 'Cohort not found' }, { status: 404 });
  }
  if (res.status === 'FORBIDDEN') {
    return NextResponse.json(
      { success: false, error: 'You do not have permission to view this cohort.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    ...res.detail,
  });
}

