'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateSubmissionEvaluation } from '@/lib/ai-service';
import { Navbar } from '@/components/Navbar';
import { EditorSurface } from '@/components/EditorSurface';
import { SocraticSidePanel } from '@/components/SocraticSidePanel';
import { PromptSelectorModal } from '@/components/PromptSelectorModal';
import { DualLayerReportModal } from '@/components/DualLayerReportModal';
import { SubmissionHistoryModal } from '@/components/SubmissionHistoryModal';
import { QuotaExceededModal } from '@/components/QuotaExceededModal';
import { ClassroomsModal } from '@/components/ClassroomsModal';
import { UpgradePlanModal } from '@/components/UpgradePlanModal';
import { AuthModals } from '@/components/auth/AuthModals';
import { AuthService } from '@/lib/auth-service';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { sanitizeTaskPrompt } from '@/lib/security-sanitize';
import { StudentCohortBundle, Cohort, CohortAssignment } from '@/types/b2b';
import { IELTSTaskPrompt } from '@/types/ielts';

import Link from 'next/link';
import { 
  Lock, 
  LogIn, 
  UserPlus, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2,
  GraduationCap,
  AlertTriangle,
  X
} from 'lucide-react';

export default function WorkspacePage() {
  const {
    currentUser,
    authModalMode,
    setAuthModalMode,
    essayText,
    targetBand,
    assistanceMode,
    currentPrompt,
    setPrompt,
    setCurrentUser,
    setTimerRunning,
    isSubmitting,
    setIsSubmitting,
    activeReport,
    setActiveReport,
    elapsedSeconds,
    history,
    getRemainingDailyEvaluations,
    recordEvaluationUsed,
    activeAssignment,
    setActiveAssignment,
    startCohortAssignment,
    activePlanCode,
    dailyEvaluationLimit,
    isUpgradeModalOpen,
    setUpgradeModalOpen,
    syncBillingStatus,
    syncHistoryFromServer,
  } = useWritingStore();

  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isClassroomsModalOpen, setIsClassroomsModalOpen] = useState(false);
  const [quotaResetsInHours, setQuotaResetsInHours] = useState(8);
  const [quotaResetsAt, setQuotaResetsAt] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [studentCohorts, setStudentCohorts] = useState<StudentCohortBundle[]>([]);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false);
  const [joinedToast, setJoinedToast] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingUrlPrompt, setPendingUrlPrompt] = useState<IELTSTaskPrompt | null>(null);

  // Verify active server session on mount & handle email verification / reset links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;

    const params = new URLSearchParams(window.location.search);
    const verifyEmailToken = params.get('verifyEmailToken')?.trim();
    const resetToken = params.get('resetToken')?.trim();

    if (resetToken) {
      try {
        window.sessionStorage.setItem('ielts_pending_reset_token', resetToken);
      } catch {
        // Ignore storage errors
      }
      setAuthModalMode('RESET_PASSWORD');
    }

    (async () => {
      if (verifyEmailToken) {
        const verified = await AuthService.verifyEmailToken(verifyEmailToken);
        if (active) {
          if (verified.success) {
            setJoinedToast(verified.message || 'Email verified successfully.');
          } else {
            setAuthNotice(verified.error || 'Email verification link is invalid or expired.');
          }
        }
      }

      const cachedUser = AuthService.getStoredUser();
      const session = await AuthService.verifyCurrentSession();
      if (!active) return;

      if (session.authenticated && session.user) {
        setCurrentUser(session.user);
      } else if (session.expired && cachedUser) {
        AuthService.clearUser();
        setCurrentUser(null);
        setAuthNotice('Your 24-hour session has expired. Sign in again to continue — your local draft is preserved.');
        setAuthModalMode('LOGIN');
      } else if (cachedUser) {
        setCurrentUser(cachedUser);
      }

      setIsCheckingAuth(false);
    })();

    return () => {
      active = false;
    };
  }, [setCurrentUser, setAuthModalMode]);

  // Fetch cohorts & assignments for the logged-in student
  const loadStudentCohorts = useCallback(async () => {
    if (!currentUser?.id) {
      setStudentCohorts([]);
      return;
    }

    setIsLoadingCohorts(true);
    try {
      const token = AuthService.getSessionToken();
      const res = await fetch('/api/cohorts?scope=student', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.cohorts)) {
        setStudentCohorts(data.cohorts);
      }
    } catch (err) {
      console.error('Failed to fetch student classrooms:', err);
    } finally {
      setIsLoadingCohorts(false);
    }
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    loadStudentCohorts();
  }, [loadStudentCohorts]);

  // Sync standalone billing tier and daily quota whenever session changes
  useEffect(() => {
    if (isCheckingAuth) return;
    if (currentUser?.id) {
      syncBillingStatus();
      syncHistoryFromServer();
    }
  }, [currentUser?.id, isCheckingAuth, syncBillingStatus, syncHistoryFromServer]);

  // Pre-load target prompt from /report/[id] ?promptId=... deep-link without clobbering active drafts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const joinCode = params.get('joinCode')?.trim().toUpperCase();
    if (joinCode) {
      try {
        window.sessionStorage.setItem('ielts_pending_join_code', joinCode);
      } catch (err) {
        console.warn('Failed to persist pending join code:', err);
      }
    }

    const promptId = params.get('promptId')?.trim();
    if (!promptId) return;

    let matchedPrompt = OFFICIAL_PROMPTS_DATABASE.find((p) => p.id === promptId) || null;

    if (!matchedPrompt) {
      try {
        const rawPending = window.sessionStorage.getItem('ielts_pending_prompt');
        if (rawPending) {
          const parsed = JSON.parse(rawPending);
          if (parsed && parsed.id === promptId) {
            matchedPrompt = sanitizeTaskPrompt(parsed);
          }
          window.sessionStorage.removeItem('ielts_pending_prompt');
        }
      } catch (err) {
        console.warn('Failed to parse pending prompt from sessionStorage:', err);
      }
    }

    if (matchedPrompt && useWritingStore.getState().currentPrompt.id !== matchedPrompt.id) {
      if (useWritingStore.getState().essayText.trim().length > 0) {
        setPendingUrlPrompt(matchedPrompt);
      } else {
        setPrompt(matchedPrompt);
      }
    }
  }, [setPrompt]);

  // Complete deferred ?joinCode=... enrollment once authenticated
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;

    let pendingCode: string | null = null;
    try {
      pendingCode = window.sessionStorage.getItem('ielts_pending_join_code');
      if (pendingCode) {
        window.sessionStorage.removeItem('ielts_pending_join_code');
      }
    } catch (err) {
      console.warn('Failed to read pending join code:', err);
    }

    if (!pendingCode) return;

    let cancelled = false;
    (async () => {
      try {
        const token = AuthService.getSessionToken();
        const res = await fetch('/api/cohorts/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            joinCode: pendingCode,
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success && data.cohort) {
          setJoinedToast(`Joined ${data.cohort.name} (${data.cohort.schoolName})`);
          await loadStudentCohorts();
          setIsClassroomsModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to auto-join cohort:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.fullName, currentUser?.username, currentUser?.email, loadStudentCohorts]);

  const matchingAssignment = useMemo(() => {
    if (!activeAssignment || activeAssignment.promptId !== currentPrompt.id) {
      return null;
    }
    for (const bundle of studentCohorts) {
      if (bundle.cohort.id === activeAssignment.cohortId) {
        const assignment = bundle.assignments.find((a) => a.id === activeAssignment.assignmentId);
        if (assignment) {
          return { ref: activeAssignment, details: assignment };
        }
      }
    }
    return { ref: activeAssignment, details: null as CohortAssignment | null };
  }, [activeAssignment, currentPrompt.id, studentCohorts]);

  const pendingAssignmentsCount = useMemo(() => {
    let count = 0;
    for (const bundle of studentCohorts) {
      for (const assignment of bundle.assignments) {
        const alreadySubmitted = bundle.submissions.some(
          (sub) => sub.assignmentId === assignment.id
        );
        if (!alreadySubmitted) {
          count += 1;
        }
      }
    }
    return count;
  }, [studentCohorts]);

  const handleSelectAssignment = (cohort: Cohort, assignment: CohortAssignment) => {
    startCohortAssignment(
      {
        cohortId: cohort.id,
        assignmentId: assignment.id,
        cohortName: cohort.name,
        promptId: assignment.prompt.id,
      },
      assignment.prompt
    );
    setJoinedToast(null);
    setIsClassroomsModalOpen(false);
  };

  // Handle Essay Submission & Dual-Layer Assessment
  const handleSubmitTask = async () => {
    if (!essayText.trim()) return;
    setSubmissionError(null);

    // Check client-side daily free practice quota
    const remaining = getRemainingDailyEvaluations();
    if (remaining <= 0 && currentUser?.role !== 'admin' && currentUser?.role !== 'teacher') {
      setIsQuotaModalOpen(true);
      return;
    }

    const isMatchingAssignment = Boolean(matchingAssignment);

    setTimerRunning(false);
    setIsSubmitting(true);
    try {
      const report = await generateSubmissionEvaluation({
        essayText,
        targetBand,
        prompt: currentPrompt,
        mode: assistanceMode,
        candidateName: currentUser?.fullName || currentUser?.username,
        timeSpentSeconds: elapsedSeconds,
        cohortId: isMatchingAssignment ? matchingAssignment?.ref.cohortId : undefined,
        assignmentId: isMatchingAssignment ? matchingAssignment?.ref.assignmentId : undefined,
      });

      if (report) {
        recordEvaluationUsed();
        setActiveReport(report);
        syncBillingStatus();
        syncHistoryFromServer();
        if (isMatchingAssignment) {
          loadStudentCohorts();
        }
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
        setAuthNotice('Please sign in again to submit your essay for evaluation — your draft is preserved.');
        setAuthModalMode('LOGIN');
      } else if (err?.message === 'DAILY_QUOTA_EXCEEDED' || err?.status === 429) {
        if (err?.resetsInHours) {
          setQuotaResetsInHours(err.resetsInHours);
        }
        if (err?.resetsAt) {
          setQuotaResetsAt(err.resetsAt);
        }
        syncBillingStatus();
        setIsQuotaModalOpen(true);
      } else {
        setSubmissionError(
          err?.message ||
            'Examiner evaluation could not be completed due to a temporary service issue. No credit was deducted — please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Workspace Navbar Header */}
      <Navbar
        isWorkspace
        onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenClassroomsModal={() => setIsClassroomsModalOpen(true)}
      />

      {/* Main Workspace Layout or Authentication Gate */}
      {isCheckingAuth ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : !currentUser ? (
        /* Student Authentication Required Gate */
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-xl w-full glass-panel rounded-3xl p-8 border border-slate-200 dark:border-gray-800 shadow-2xl space-y-6 text-center animate-fadeIn">
            
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Protected Learning Environment</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                Authentication Required
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                To guarantee genuine skill acquisition, track your progression towards your target band score, and retain your assessment reports, please sign in or register an account.
              </p>
            </div>

            {/* Feature Highlights Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Active anti-paste cognitive retention protection</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Live Socratic guidance cards tuned to your target band</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Dual-layer examiner grading with downloadable PDF & Telegram export</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setAuthModalMode('LOGIN')}
                className="py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Account</span>
              </button>

              <button
                onClick={() => setAuthModalMode('REGISTER')}
                className="py-3 px-4 rounded-xl border border-slate-300 dark:border-gray-700 hover:border-brand-500 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-200 hover:text-brand-600 dark:hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Free Account</span>
              </button>
            </div>

            {/* Return to Home Link */}
            <div className="pt-3 border-t border-slate-200 dark:border-gray-800/80 flex items-center justify-center text-xs">
              <Link
                href="/"
                className="text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors font-medium py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Home</span>
              </Link>
            </div>

          </div>
        </main>
      ) : (
        /* Authenticated Student Workspace */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {(authNotice || submissionError) && (
            <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-medium">{submissionError || authNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmissionError(null);
                  setAuthNotice(null);
                }}
                aria-label="Dismiss error banner"
                className="p-1 rounded-md text-rose-500 hover:text-rose-800 dark:hover:text-rose-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {pendingUrlPrompt && (
            <div className="lg:col-span-12 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-100">
              <span>
                Switch to linked task <strong>&ldquo;{pendingUrlPrompt.title}&rdquo;</strong>? Your current draft will stay auto-saved under{' '}
                <em>{currentPrompt.title}</em>.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPendingUrlPrompt(null)}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/40 font-semibold"
                >
                  Keep Current
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(pendingUrlPrompt);
                    setPendingUrlPrompt(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Save Draft &amp; Load Task
                </button>
              </div>
            </div>
          )}

          {(joinedToast || matchingAssignment || pendingAssignmentsCount > 0) && (
            <div className="lg:col-span-12 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200 min-w-0">
                {joinedToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold truncate">{joinedToast}</span>
                  </>
                ) : matchingAssignment ? (
                  <>
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                      <span className="font-bold">
                        Cohort Assignment • {matchingAssignment.ref.cohortName}
                      </span>
                      {matchingAssignment.details?.dueDate && (
                        <span className="text-indigo-700/80 dark:text-indigo-300/80">
                          Due {matchingAssignment.details.dueDate}
                        </span>
                      )}
                      {matchingAssignment.details?.teacherNotes && (
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-xl">
                          — Coach note: {matchingAssignment.details.teacherNotes}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      You have{' '}
                      <strong>{pendingAssignmentsCount}</strong>{' '}
                      {pendingAssignmentsCount === 1 ? 'assigned IELTS task' : 'assigned IELTS tasks'} waiting in your classroom.
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsClassroomsModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  {matchingAssignment ? 'All Classrooms' : 'View Assignments'}
                </button>
                {matchingAssignment && !joinedToast && (
                  <button
                    onClick={() => setActiveAssignment(null)}
                    className="px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium transition-colors"
                  >
                    Detach Assignment
                  </button>
                )}
                {joinedToast && (
                  <button
                    onClick={() => setJoinedToast(null)}
                    aria-label="Dismiss classroom notification"
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Left/Center 8 cols: Editor Surface Canvas */}
          <section className="lg:col-span-8 h-full">
            <EditorSurface
              onSubmitTask={handleSubmitTask}
              onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
              isModalOpen={
                isPromptsModalOpen ||
                Boolean(activeReport) ||
                isHistoryModalOpen ||
                isQuotaModalOpen ||
                isUpgradeModalOpen ||
                isClassroomsModalOpen ||
                Boolean(authModalMode)
              }
            />
          </section>

          {/* Right 4 cols: Real-Time Socratic Guidance Panel */}
          <section className="lg:col-span-4 h-full">
            <SocraticSidePanel />
          </section>

        </main>
      )}

      {/* Modals */}
      <PromptSelectorModal
        isOpen={isPromptsModalOpen}
        onClose={() => setIsPromptsModalOpen(false)}
      />

      <DualLayerReportModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />

      <SubmissionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        submissions={history}
        onSelectReport={(report) => setActiveReport(report)}
      />

      <QuotaExceededModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenUpgrade={() => setUpgradeModalOpen(true)}
        resetsInHours={quotaResetsInHours}
        resetsAt={quotaResetsAt}
        dailyLimit={dailyEvaluationLimit}
        planCode={activePlanCode}
      />

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <ClassroomsModal
        isOpen={isClassroomsModalOpen}
        onClose={() => setIsClassroomsModalOpen(false)}
        bundles={studentCohorts}
        isLoading={isLoadingCohorts}
        onRefresh={loadStudentCohorts}
        onSelectAssignment={handleSelectAssignment}
      />

      <AuthModals />
    </div>
  );
}
