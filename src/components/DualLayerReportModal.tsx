'use client';

import React, { useState, useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { SubmissionReport } from '@/types/ielts';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  FileDown,
  Send,
  Copy,
  Check,
  Printer,
  Link2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIELTSReportPDF, generateTelegramShareData, getPublicReportUrl } from '@/lib/pdf-service';
import { ReportDetailsTabs } from '@/components/ReportDetailsTabs';

interface DualLayerReportModalProps {
  report: SubmissionReport | null;
  onClose: () => void;
}

export const DualLayerReportModal: React.FC<DualLayerReportModalProps> = ({ report, onClose }) => {
  const { currentUser } = useWritingStore();
  const [activeTab, setActiveTab] = useState<'LAYER_1' | 'LAYER_2'>('LAYER_1');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedLinkSuccess, setCopiedLinkSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Trigger celebration confetti once per unique report if target achieved or exceeded
  useEffect(() => {
    if (report && report.layer2AlignmentReport.targetStatus !== 'TARGET_NOT_MET') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [report?.id]);

  if (!report) return null;

  const { layer1ExaminerReport, layer2AlignmentReport, targetBandAtSubmission, modeAtSubmission, wordCount } = report;

  const getStatusBadge = () => {
    switch (layer2AlignmentReport.targetStatus) {
      case 'TARGET_ACHIEVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Target Band Achieved!
          </span>
        );
      case 'EXCEEDED_TARGET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Target Exceeded! (+{(layer2AlignmentReport.achievedBand - parseFloat(targetBandAtSubmission)).toFixed(1)})
          </span>
        );
      case 'TARGET_NOT_MET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Target Not Met (Gap: {(parseFloat(targetBandAtSubmission) - layer2AlignmentReport.achievedBand).toFixed(1)})
          </span>
        );
    }
  };

  const candidateDisplayName = currentUser?.fullName || currentUser?.username || report.candidateName || 'IELTS Candidate';

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateIELTSReportPDF(report, candidateDisplayName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareToTelegram = () => {
    const { shareUrl } = generateTelegramShareData(report, candidateDisplayName);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopySummary = async () => {
    const { shareText } = generateTelegramShareData(report, candidateDisplayName);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCopyLink = async () => {
    const publicUrl = getPublicReportUrl(report.id);
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLinkSuccess(true);
      setTimeout(() => setCopiedLinkSuccess(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700/80 shadow-2xl relative max-h-[92vh] flex flex-col text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4 mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-gray-950 font-black text-xl shadow-lg shadow-amber-500/20">
              {layer1ExaminerReport.overallBand.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Official IELTS Assessment Report</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Submitted in {modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Mentor Mode' : 'Focus Exam Mode'} • Target: Band {targetBandAtSubmission} • Words: {wordCount}
              </p>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Download Official IELTS Test Report Form as .pdf"
            >
              <FileDown className="h-4 w-4" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleShareToTelegram}
              className="px-3 py-1.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-bold text-xs shadow-md shadow-[#229ED9]/25 flex items-center gap-1.5 transition-all"
              title="Share report to teachers or friends on Telegram"
            >
              <Send className="h-4 w-4" />
              <span>Share to Telegram</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 transition-all text-xs font-bold flex items-center gap-1.5"
              title="Copy public /report/[id] deep link"
            >
              {copiedLinkSuccess ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <Link2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{copiedLinkSuccess ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-gray-700 transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Copy score report summary to clipboard"
            >
              {copiedSuccess ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copiedSuccess ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-gray-700 transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Print via browser dialog"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ReportDetailsTabs
          report={report}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollable
        />

        {/* Footer Actions Strip */}
        <div className="border-t border-slate-200 dark:border-gray-800 pt-4 mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span>Assessment certified by Official Senior IELTS Examiner Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              <span>{isGeneratingPdf ? 'Preparing PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              onClick={handleShareToTelegram}
              className="px-4 py-2 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-bold text-xs shadow-md shadow-[#229ED9]/25 flex items-center gap-1.5 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Share to Telegram</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white border border-slate-200 dark:border-gray-700 font-semibold text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

