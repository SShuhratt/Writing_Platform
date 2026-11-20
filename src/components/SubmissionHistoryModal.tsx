'use client';

import React from 'react';
import { SubmissionReport } from '@/types/ielts';
import { 
  X, 
  Award, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  History,
  TrendingUp,
  Clock
} from 'lucide-react';

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: SubmissionReport[];
  onSelectReport: (report: SubmissionReport) => void;
}

export const SubmissionHistoryModal: React.FC<SubmissionHistoryModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onSelectReport,
}) => {
  if (!isOpen) return null;

  const totalEvaluations = submissions.length;
  const avgScore = totalEvaluations > 0
    ? (submissions.reduce((acc, s) => acc + s.layer1ExaminerReport.overallBand, 0) / totalEvaluations).toFixed(1)
    : '0.0';

  const highestScore = totalEvaluations > 0
    ? Math.max(...submissions.map(s => s.layer1ExaminerReport.overallBand)).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl p-6 border border-slate-200 dark:border-gray-800 shadow-2xl relative max-h-[88vh] flex flex-col text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">My Practice & Evaluation History</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  {totalEvaluations} {totalEvaluations === 1 ? 'Essay' : 'Essays'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Track your band progression, review examiner commentaries, and re-export reports</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Progression Summary Cards */}
        {totalEvaluations > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 text-center">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Total Evaluated</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalEvaluations}</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Average Band</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">Band {avgScore}</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Highest Band</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">Band {highestScore}</div>
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {totalEvaluations === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-gray-200">No Evaluated Submissions Yet</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                  Draft an essay in the Practice Workspace and submit it for evaluation. Your scores and examiner feedback will be archived here.
                </p>
              </div>
            </div>
          ) : (
            submissions.map((item, idx) => {
              const status = item.layer2AlignmentReport.targetStatus;
              const overallBand = item.layer1ExaminerReport.overallBand;
              const target = item.targetBandAtSubmission;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    onSelectReport(item);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                        {item.taskPrompt.type === 'TASK_2_ESSAY' ? 'Task 2 Essay' : 'Task 1 Report'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                      {item.taskPrompt.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                      <span>{item.wordCount} words</span>
                      <span>•</span>
                      <span>Target Band {target}</span>
                      <span>•</span>
                      <span>{item.modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Mentor' : 'Focus Exam'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-500">
                        Band {overallBand.toFixed(1)}
                      </div>
                      <div className="text-[10px] font-bold">
                        {status === 'TARGET_ACHIEVED' ? (
                          <span className="text-emerald-500 flex items-center gap-0.5 justify-end">
                            <CheckCircle2 className="h-3 w-3" /> Met Target
                          </span>
                        ) : status === 'EXCEEDED_TARGET' ? (
                          <span className="text-purple-500 flex items-center gap-0.5 justify-end">
                            <Sparkles className="h-3 w-3" /> Exceeded
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center gap-0.5 justify-end">
                            <AlertTriangle className="h-3 w-3" /> Under Target
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-gray-700/60 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shadow-sm">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

