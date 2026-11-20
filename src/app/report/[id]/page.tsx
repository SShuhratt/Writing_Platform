import React from 'react';
import type { Metadata } from 'next';
import { fetchReportById } from '@/lib/submission-repository';
import { PublicReportView } from '@/components/PublicReportView';

export const dynamic = 'force-dynamic';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://writing-platform-git-main-sshuhratts-projects.vercel.app';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const report = await fetchReportById(params.id);

  if (!report) {
    return {
      title: 'IELTS Evaluation Report | IELTS Mentor AI',
      description:
        'View certified IELTS Writing evaluation reports, examiner band scores, and practice official exam tasks.',
    };
  }

  const overall = report.layer1ExaminerReport.overallBand.toFixed(1);
  const ta = report.layer1ExaminerReport.taskResponse.score.toFixed(1);
  const cc = report.layer1ExaminerReport.coherenceCohesion.score.toFixed(1);
  const lr = report.layer1ExaminerReport.lexicalResource.score.toFixed(1);
  const gra = report.layer1ExaminerReport.grammaticalAccuracy.score.toFixed(1);
  const candidatePrefix = report.candidateName ? `${report.candidateName} — ` : '';

  const title = `${candidatePrefix}Band ${overall} IELTS Writing Report | IELTS Mentor AI`;
  const description = `Achieved Band ${overall} (TA ${ta} • CC ${cc} • LR ${lr} • GRA ${gra}) on "${report.taskPrompt.title}". Inspect full examiner diagnostics and practice this exact IELTS topic.`;
  const reportUrl = `${SITE_ORIGIN}/report/${encodeURIComponent(report.id)}`;
  const ogImageUrl = `${SITE_ORIGIN}/brand-logo.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: reportUrl,
      siteName: 'IELTS Mentor AI',
      images: [
        {
          url: ogImageUrl,
          alt: 'IELTS Mentor AI Official Writing Assessment Report',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Server-rendered public deep-link route (/report/[id]) for sharing IELTS assessment reports.
 */
export default async function PublicReportPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await fetchReportById(params.id);
  return <PublicReportView reportId={params.id} initialReport={report} />;
}

