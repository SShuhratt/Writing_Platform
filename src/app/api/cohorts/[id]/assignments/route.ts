import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { verifyTeacherOrAdminRequest } from '@/lib/server-auth';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { createCohortAssignment, deleteCohortAssignment } from '@/lib/b2b-repository';
import { IELTSTaskPrompt } from '@/types/ielts';

/**
 * Assigns an official or custom IELTS task prompt to a cohort owned by the authenticated teacher/admin.
 */
export async function POST(
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
    prefix: 'cohort_assign',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const cohortId = context?.params?.id ? String(context.params.id).trim() : '';
    const body = await request.json();

    let resolvedPrompt: IELTSTaskPrompt | null = null;
    if (typeof body?.promptId === 'string' && body.promptId.trim()) {
      resolvedPrompt =
        OFFICIAL_PROMPTS_DATABASE.find((p) => p.id === body.promptId.trim()) || null;
    }

    if (!resolvedPrompt && body?.prompt) {
      const q = typeof body.prompt.questionText === 'string' ? body.prompt.questionText.trim() : '';
      const t = typeof body.prompt.title === 'string' ? body.prompt.title.trim() : '';
      if (t.length >= 3 && q.length >= 10) {
        resolvedPrompt = {
          id: body.prompt.id || `school-prompt-${Date.now()}`,
          title: t,
          type: body.prompt.type || 'TASK_2_ESSAY',
          category: body.prompt.category || 'School Assignment',
          questionText: q,
          minWordCount: Number(body.prompt.minWordCount || (body.prompt.type === 'TASK_2_ESSAY' ? 250 : 150)),
          recommendedTimeMinutes: Number(body.prompt.recommendedTimeMinutes || (body.prompt.type === 'TASK_2_ESSAY' ? 40 : 20)),
        };
      }
    }

    if (!resolvedPrompt) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid IELTS prompt or provide a custom question (>= 10 chars).' },
        { status: 400 }
      );
    }

    const result = await createCohortAssignment({
      cohortId,
      requesterId: staff.userId,
      isAdmin: staff.role === 'admin',
      prompt: resolvedPrompt,
      teacherNotes: body?.teacherNotes,
      dueDate: body?.dueDate,
    });

    if (result.status === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Cohort not found' }, { status: 404 });
    }
    if (result.status === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'Access denied for this cohort' }, { status: 403 });
    }

    return NextResponse.json({ success: true, assignment: result.assignment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to assign prompt to cohort' },
      { status: 500 }
    );
  }
}

/**
 * Removes an assignment from a cohort owned by the authenticated teacher/admin.
 */
export async function DELETE(
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
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId')?.trim() || '';

  if (!cohortId || !assignmentId) {
    return NextResponse.json(
      { success: false, error: 'Cohort ID and assignmentId are required' },
      { status: 400 }
    );
  }

  const status = await deleteCohortAssignment({
    cohortId,
    assignmentId,
    requesterId: staff.userId,
    isAdmin: staff.role === 'admin',
  });

  if (status === 'NOT_FOUND') {
    return NextResponse.json({ success: false, error: 'Cohort not found' }, { status: 404 });
  }
  if (status === 'FORBIDDEN') {
    return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}

