'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import { StudentCohortBundle, Cohort, CohortAssignment } from '@/types/b2b';
import {
  X,
  GraduationCap,
  KeyRound,
  BookOpen,
  Calendar,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ClassroomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundles: StudentCohortBundle[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSelectAssignment: (cohort: Cohort, assignment: CohortAssignment) => void;
}

/**
 * Student Classroom modal allowing students to join school cohorts by invite code
 * and launch teacher-assigned writing tasks inside the Practice Workspace.
 */
export const ClassroomsModal: React.FC<ClassroomsModalProps> = ({
  isOpen,
  onClose,
  bundles,
  isLoading,
  onRefresh,
  onSelectAssignment,
}) => {
  const { currentUser } = useWritingStore();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetMessages = useCallback(() => {
    setError('');
    setSuccessMsg('');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetMessages();
    }
  }, [isOpen, resetMessages]);

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !joinCode.trim()) return;

    resetMessages();
    setIsJoining(true);

    try {
      const token = AuthService.getSessionToken();
      const res = await fetch('/api/cohorts/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not join class with that invite code.');
        return;
      }

      setSuccessMsg(`Joined "${data.cohort?.name || 'Cohort'}" successfully!`);
      setJoinCode('');
      await onRefresh();
    } catch {
      setError('Network error while joining classroom.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-700/80 shadow-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">My School Classes &amp; Assignments</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Join your teacher&apos;s cohort and submit assigned IELTS writing tasks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Join Cohort Form */}
          <form
            onSubmit={handleJoinSubmit}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200 dark:border-gray-800 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
              <KeyRound className="h-4 w-4 text-indigo-500" />
              <span>Join a Cohort with Class Invite Code</span>
            </div>

            {error && (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</div>
            )}
            {successMsg && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {successMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                maxLength={12}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code (e.g. A7K9M2)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isJoining || !joinCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isJoining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Join Class</span>
              </button>
            </div>
          </form>

          {/* Enrolled Cohorts List */}
          {isLoading ? (
            <div className="py-10 flex items-center justify-center text-xs text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span>Loading enrolled cohorts...</span>
            </div>
          ) : bundles.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-xs text-slate-500 dark:text-gray-400">
              <p className="font-semibold text-slate-700 dark:text-gray-300">
                You haven&apos;t joined any school classes yet.
              </p>
              <p>
                Ask your IELTS instructor for their 6-character invite code, or instructors can
                create classes in the{' '}
                <Link href="/teacher" className="text-indigo-500 underline font-semibold">
                  Teacher Portal
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bundles.map((bundle) => (
                <div
                  key={bundle.cohort.id}
                  className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 overflow-hidden"
                >
                  <div className="px-5 py-3.5 bg-slate-50 dark:bg-gray-900/80 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {bundle.cohort.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">
                        {bundle.cohort.schoolName} • Instructor: {bundle.cohort.teacherName} •
                        Target Band {bundle.cohort.targetBand}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/20">
                      Code: {bundle.cohort.joinCode}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {bundle.assignments.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-gray-400 italic">
                        No writing tasks assigned yet by your instructor.
                      </p>
                    ) : (
                      bundle.assignments.map((assign) => {
                        const completedSub = bundle.submissions.find(
                          (s) =>
                            s.assignmentId === assign.id || s.promptId === assign.prompt.id
                        );

                        return (
                          <div
                            key={assign.id}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                                  {assign.prompt.title}
                                </span>
                                {assign.dueDate && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due {assign.dueDate}
                                  </span>
                                )}
                                {completedSub && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Submitted • Band {completedSub.overallBand.toFixed(1)}
                                  </span>
                                )}
                              </div>

                              {assign.teacherNotes && (
                                <p className="text-[11px] text-slate-600 dark:text-gray-400">
                                  <strong className="text-slate-700 dark:text-gray-300">
                                    Coach Focus:
                                  </strong>{' '}
                                  {assign.teacherNotes}
                                </p>
                              )}

                              {completedSub?.teacherFeedback && (
                                <div className="mt-1.5 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Instructor Review:</strong> {completedSub.teacherFeedback}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {completedSub && (
                                <Link
                                  href={`/report/${encodeURIComponent(completedSub.reportId)}`}
                                  target="_blank"
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs font-semibold flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Report</span>
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectAssignment(bundle.cohort, assign)}
                                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
                              >
                                <span>{completedSub ? 'Practice Again' : 'Write Assignment'}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

