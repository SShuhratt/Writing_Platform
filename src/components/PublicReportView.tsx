'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SubmissionReport } from '@/types/ielts';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { AuthModals } from '@/components/auth/AuthModals';
import { ReportDetailsTabs } from '@/components/ReportDetailsTabs';
import {
  generateIELTSReportPDF,
  generateTelegramShareData,
  getPublicReportUrl,
} from '@/lib/pdf-service';
import {
  Award,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  FileDown,
  Send,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  Calendar,
  BookOpen,
  ArrowRight,
  SearchX,
} from 'lucide-react';

export interface PublicReportViewProps {
  reportId: string;
  initialReport: SubmissionReport | null;
}

const PENDING_PROMPT_STORAGE_KEY = 'ielts_pending_prompt';

/**
 * Public, shareable IELTS Writing Assessment Report view supporting Telegram/WhatsApp deep-links,
 * PDF download, full Dual-Layer breakdown, collapsible transcript, and direct topic practice launch.
 */
export const PublicReportView: React.FC<PublicReportViewProps> = ({
  reportId,
  initialReport,
}) => {
  const { currentUser, setCurrentUser, history } = useWritingStore();
  const [report, setReport] = useState<SubmissionReport | null>(initialReport);
  const [checkedLocalHistory, setCheckedLocalHistory] = useState<boolean>(Boolean(initialReport));
  const [activeTab, setActiveTab] = useState<'LAYER_1' | 'LAYER_2'>('LAYER_1');
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser) {
      const storedUser = AuthService.getStoredUser();
      if (storedUser) {
        setCurrentUser(storedUser);
      }
    }
  }, [currentUser, setCurrentUser]);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      setCheckedLocalHistory(true);
      return;
    }

    const localMatch = history.find((item) => item.id === reportId) || null;
    if (localMatch) {
      setReport(localMatch);
    }
    setCheckedLocalHistory(true);
  }, [initialReport, history, reportId]);

  const handlePracticeTopic = () => {
    if (!report || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        PENDING_PROMPT_STORAGE_KEY,
        JSON.stringify(report.taskPrompt)
      );
    } catch (err) {
      console.warn('Could not store pending prompt in sessionStorage:', err);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    try {
      const candidate = report.candidateName || currentUser?.fullName || currentUser?.username || 'IELTS Candidate';
      generateIELTSReportPDF(report, candidate);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareToTelegram = () => {
    if (!report) return;
    const candidate = report.candidateName || currentUser?.fullName || currentUser?.username || 'IELTS Candidate';
    const { shareUrl } = generateTelegramShareData(report, candidate);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShareLink = async () => {
    if (!report) return;
    const publicUrl = getPublicReportUrl(report.id);
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  const renderStatusBadge = (targetReport: SubmissionReport) => {
    const status = targetReport.layer2AlignmentReport.targetStatus;
    const achieved = targetReport.layer2AlignmentReport.achievedBand;
    const targetNum = parseFloat(targetReport.targetBandAtSubmission);

    if (status === 'TARGET_ACHIEVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Target Band Achieved
        </span>
      );
    }
    if (status === 'EXCEEDED_TARGET') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Target Exceeded (+{(achieved - targetNum).toFixed(1)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        Target Not Met (Gap: {(targetNum - achieved).toFixed(1)})
      </span>
    );
  };

  const formatTaskTypeLabel = (type: SubmissionReport['taskPrompt']['type']) => {
    if (type === 'TASK_1_ACADEMIC') return 'Academic Writing Task 1';
    if (type === 'TASK_1_GENERAL') return 'General Training Task 1';
    return 'Writing Task 2 Essay';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {!report && !checkedLocalHistory && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-8 animate-pulse space-y-4">
            <div className="h-6 w-56 bg-slate-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-4 w-full max-w-xl bg-slate-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-48 w-full bg-slate-100 dark:bg-gray-800/60 rounded-xl" />
          </div>
        )}

        {!report && checkedLocalHistory && (
          <div className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xl p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto my-8">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <SearchX className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Evaluation Report Not Found
              </h1>
              <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                We couldn&apos;t locate a shared report for ID <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-xs font-mono">{reportId}</code>. The report link may have expired or been created only in another browser session without database persistence.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/workspace"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all"
              >
                <PenTool className="h-4 w-4" />
                <span>Start Practice in IELTS Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm border border-slate-200 dark:border-gray-700 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {report && (
          <>
            {/* Official Certificate Summary Card */}
            <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-brand-500/15 px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-200">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Certified IELTS Writing Assessment Report</span>
                  <span className="text-slate-400 dark:text-gray-600">•</span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-gray-400">
                    {report.id}
                  </span>
                </div>
                {renderStatusBadge(report)}
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex flex-col items-center justify-center text-gray-950 shadow-lg shadow-amber-500/20 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Band</span>
                      <span className="text-2xl sm:text-3xl font-black leading-none">
                        {report.layer1ExaminerReport.overallBand.toFixed(1)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {formatTaskTypeLabel(report.taskPrompt.type)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1" suppressHydrationWarning>
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(report.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                        {report.taskPrompt.title}
                      </h1>

                      <p className="text-xs text-slate-600 dark:text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong className="text-slate-800 dark:text-gray-200">Candidate:</strong>{' '}
                          {report.candidateName || 'IELTS Candidate'}
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-slate-800 dark:text-gray-200">Target:</strong> Band {report.targetBandAtSubmission}
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-slate-800 dark:text-gray-200">Length:</strong> {report.wordCount} words
                        </span>
                        <span>•</span>
                        <span>
                          {report.modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Mentor Mode' : 'Focus Exam Mode'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Export & Share Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>{isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF'}</span>
                    </button>

                    <button
                      onClick={handleCopyShareLink}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </button>

                    <button
                      onClick={handleShareToTelegram}
                      className="px-3.5 py-2 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-bold text-xs shadow-md shadow-[#229ED9]/25 flex items-center gap-1.5 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>Share on Telegram</span>
                    </button>
                  </div>
                </div>

                {/* Official Topic Prompt Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200 dark:border-gray-800 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                    Exam Question Prompt
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {report.taskPrompt.questionText}
                  </p>
                  {report.taskPrompt.chartDescription && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 italic pt-1">
                      Visual Data Context: {report.taskPrompt.chartDescription}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Dual-Layer Evaluation Tabs (Shared Component) */}
            <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-lg p-5 sm:p-7">
              <ReportDetailsTabs
                report={report}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                scrollable={false}
              />
            </section>

            {/* Collapsible Candidate Essay Transcript */}
            <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTranscript((prev) => !prev)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Candidate Essay Transcript
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {showTranscript ? 'Hide' : 'Read'} full submitted response ({report.wordCount} words)
                    </p>
                  </div>
                </div>
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300">
                  {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {showTranscript && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-200 dark:border-gray-800">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200 dark:border-gray-800 text-sm text-slate-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-serif">
                    {report.essayText}
                  </div>
                </div>
              )}
            </section>

            {/* Viral Practice Conversion CTA */}
            <section className="rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Try This Exact IELTS Task</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight">
                  Ready to Beat Band {report.layer1ExaminerReport.overallBand.toFixed(1)} on &ldquo;{report.taskPrompt.title}&rdquo;?
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                  Launch the interactive IELTS Writing Workspace pre-loaded with this exact prompt, real-time Socratic coaching, and official Dual-Layer Examiner scoring.
                </p>
              </div>

              <Link
                href={`/workspace?promptId=${encodeURIComponent(report.taskPrompt.id)}`}
                onClick={handlePracticeTopic}
                className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shadow-lg shadow-black/25 flex items-center gap-2 transition-all shrink-0"
              >
                <PenTool className="h-4 w-4" />
                <span>Practice This Exact Topic Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </>
        )}
      </main>

      <Footer />
      <AuthModals />
    </div>
  );
};
