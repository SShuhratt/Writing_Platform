import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { fetchReportById } from '@/lib/submission-repository';

const VALID_REPORT_ID = /^[a-zA-Z0-9_-]{4,80}$/;

/**
 * Public read-only endpoint returning a sanitized IELTS evaluation report by ID for /report/[id] deep links.
 */
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const rateLimitResult = await checkRateLimitAsync(request, {
    limit: 60,
    windowMs: 60 * 1000,
    prefix: 'public_report_get',
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  const reportId = context?.params?.id ? String(context.params.id).trim() : '';
  if (!VALID_REPORT_ID.test(reportId)) {
    return NextResponse.json({ error: 'Invalid report identifier' }, { status: 400 });
  }

  const report = await fetchReportById(reportId);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, report }, { status: 200 });
}

