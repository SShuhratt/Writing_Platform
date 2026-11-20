import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyAuthenticatedRequest, verifyTeacherOrAdminRequest } from '@/lib/server-auth';
import { findStudentAccountById } from '@/lib/account-repository';
import {
  createCohort,
  listStudentCohorts,
  listTeacherCohorts,
  seedSampleCohortDemo,
} from '@/lib/b2b-repository';

/**
 * Lists cohorts for authenticated teachers/admins or authenticated student classrooms.
 */
export async function GET(request: Request) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 60,
    windowMs: 60 * 1000,
    prefix: 'cohorts_get',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const staff = verifyTeacherOrAdminRequest(request);

    if (scope !== 'student' && staff) {
      const cohorts = await listTeacherCohorts(staff.userId, staff.role === 'admin');
      return NextResponse.json({
        success: true,
        mode: 'teacher',
        cohorts,
      });
    }

    const authUser = verifyAuthenticatedRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view student cohorts.' },
        { status: 401 }
      );
    }

    const studentAccount =
      authUser.role === 'user' ? await findStudentAccountById(authUser.userId) : null;
    const verifiedEmail =
      studentAccount?.email || (authUser.username.includes('@') ? authUser.username : undefined);

    const cohorts = await listStudentCohorts(authUser.userId, verifiedEmail);
    return NextResponse.json({
      success: true,
      mode: 'student',
      cohorts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load cohorts' },
      { status: 500 }
    );
  }
}

/**
 * Creates a new school cohort or populates a sample demo class for verified teachers/admins.
 */
export async function POST(request: Request) {
  const staff = verifyTeacherOrAdminRequest(request);
  if (!staff) {
    return NextResponse.json(
      { success: false, error: 'Instructor or administrator authentication required.' },
      { status: 401 }
    );
  }

  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 20,
    windowMs: 60 * 1000,
    prefix: 'cohorts_create',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();

    if (body?.action === 'SEED_DEMO') {
      const bundle = await seedSampleCohortDemo({
        teacherId: staff.userId,
        teacherName: staff.fullName || staff.username,
        schoolName: staff.schoolName,
      });
      return NextResponse.json({ success: true, cohort: bundle.cohort, detail: bundle });
    }

    const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
    if (rawName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Cohort name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    const cohort = await createCohort({
      name: rawName,
      schoolName: body?.schoolName || staff.schoolName,
      targetBand: body?.targetBand,
      teacherId: staff.userId,
      teacherName: staff.fullName || staff.username,
    });

    return NextResponse.json({ success: true, cohort }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create cohort' },
      { status: 500 }
    );
  }
}

