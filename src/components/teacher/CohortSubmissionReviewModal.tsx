'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthService } from '@/lib/auth-service';
import { SubmissionReport } from '@/types/ielts';
import { CohortSubmissionItem } from '@/types/b2b';
import { ReportDetailsTabs } from '@/components/ReportDetailsTabs';
import {
  X,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Award,
  FileText,
  Send,
} from 'lucide-react';

interface CohortSubmissionReviewModalProps {
  cohortId: string;
  submission: CohortSubmissionItem | null;
  onClose: () => void;
  onFeedbackSaved: (updated: CohortSubmissionItem) => void;
}

/**
 * Inspector modal letting school instructors review a student's full Dual-Layer AI report,
 * inline essay highlights, and save personalized coaching notes.
 */
export const CohortSubmissionReviewModal: React.FC<CohortSubmissionReviewModalProps> = ({
  cohortId,
  submission,
  onClose,
  onFeedbackSaved,
}) => {
  const [report, setReport] = useState<SubmissionReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'LAYER_1' | 'LAYER_2'>('LAYER_2');
  const [feedback, setFeedback] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submission) {
      setReport(null);
      return;
    }

    setFeedback(submission.teacherFeedback || '');
    setSavedNotice(false);
    setError('');
    setIsLoadingReport(true);

    let active = true;
    fetch(`/api/reports/${encodeURIComponent(submission.reportId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.report) {
          setReport(data.report);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingReport(false);
      });

    return () => {
      active = false;
    };
  }, [submission]);

  if (!submission) return null;

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedNotice(false);
    setIsSavingFeedback(true);

    try {
      const token = AuthService.getStaffToken();
      const res = await fetch(`/api/cohorts/${encodeURIComponent(cohortId)}/submissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reportId: submission.reportId,
          feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.submission) {
        setError(data.error || 'Could not save instructor coaching note.');
        return;
      }

      setSavedNotice(true);
      onFeedbackSaved(data.submission);
    } catch {
      setError('Network error while saving feedback.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-700/80 shadow-2xl max-h-[92vh] flex flex-col text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-gray-950 font-black text-lg shadow">
              {submission.overallBand.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {submission.studentName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  {submission.wordCount} words
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {submission.promptTitle} • TA {submission.taskResponseScore.toFixed(1)} • CC{' '}
                {submission.coherenceScore.toFixed(1)} • LR {submission.lexicalScore.toFixed(1)} •
                GRA {submission.grammarScore.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/report/${encodeURIComponent(submission.reportId)}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-gray-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Link</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructor Feedback Box */}
          <form
            onSubmit={handleSaveFeedback}
            className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span>Instructor Coaching Note &amp; Score Verification</span>
              </label>
              {savedNotice && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Feedback saved for student</span>
                </span>
              )}
            </div>

            {error && (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</div>
            )}

            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write targeted teacher remarks (e.g., strong thesis, revise Body 2 example and bring a printed outline to Friday seminar)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingFeedback}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingFeedback ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Save Instructor Note</span>
              </button>
            </div>
          </form>

          {/* Full Dual-Layer AI Diagnostics & Highlights */}
          {isLoadingReport ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span>Loading full AI examiner diagnostics &amp; inline sentence highlights...</span>
            </div>
          ) : report ? (
            <div className="space-y-6">
              <ReportDetailsTabs
                report={report}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                scrollable={false}
              />

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200 dark:border-gray-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-brand-500" />
                  <span>Full Candidate Essay Transcript</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-serif">
                  {report.essayText}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-600 dark:text-gray-400 flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Score Summary Available (Full Report Payload Expired from Local Cache)
                </div>
                <p>
                  Criterion breakdown ({submission.overallBand.toFixed(1)} overall) is preserved
                  above. Configure Turso or Supabase credentials to retain complete essay transcripts
                  across server restarts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

