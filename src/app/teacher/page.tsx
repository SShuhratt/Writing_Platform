'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import { Navbar } from '@/components/Navbar';
import { AuthModals } from '@/components/auth/AuthModals';
import { ALL_TARGET_BANDS } from '@/lib/ielts-rubric';

const AssignPromptModal = dynamic(
  () => import('@/components/teacher/AssignPromptModal').then((m) => m.AssignPromptModal),
  { ssr: false }
);
const CohortSubmissionReviewModal = dynamic(
  () =>
    import('@/components/teacher/CohortSubmissionReviewModal').then(
      (m) => m.CohortSubmissionReviewModal
    ),
  { ssr: false }
);
import { TargetBand } from '@/types/ielts';
import {
  CohortDetailBundle,
  CohortSubmissionItem,
  CohortWithStats,
} from '@/types/b2b';
import {
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Award,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Calendar,
  ExternalLink,
  Loader2,
  Link2,
  Eye,
  Lock,
} from 'lucide-react';

export default function TeacherPortalPage() {
  const { currentUser, setCurrentUser } = useWritingStore();

  // Auth State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Cohort Dashboard State
  const [cohorts, setCohorts] = useState<CohortWithStats[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [cohortDetail, setCohortDetail] = useState<CohortDetailBundle | null>(null);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'SUBMISSIONS' | 'ROSTER'>('SUBMISSIONS');

  // Create Cohort Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortSchool, setNewCohortSchool] = useState('');
  const [newCohortBand, setNewCohortBand] = useState<TargetBand>('7.0');
  const [isCreatingCohort, setIsCreatingCohort] = useState(false);

  // Assign & Review Modals State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<CohortSubmissionItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  useEffect(() => {
    let active = true;
    const storedUser = AuthService.getStoredUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }

    // Do not block unauthenticated visitors behind a loading spinner while probing cookie state
    const hasStaffHint =
      Boolean(AuthService.getStaffToken()) ||
      storedUser?.role === 'teacher' ||
      storedUser?.role === 'admin';
    if (!hasStaffHint) {
      setIsCheckingAuth(false);
    }

    const checkAuth = async () => {
      const verified = await AuthService.verifyTeacherSession();
      if (active) {
        setIsStaffAuthenticated(verified.authenticated);
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
    return () => {
      active = false;
    };
  }, [setCurrentUser]);

  const loadCohorts = useCallback(async () => {
    setIsLoadingCohorts(true);
    try {
      const token = AuthService.getStaffToken();
      const res = await fetch('/api/cohorts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.cohorts)) {
        setCohorts(data.cohorts);
        if (data.cohorts.length > 0) {
          setSelectedCohortId((prev) =>
            prev && data.cohorts.some((c: CohortWithStats) => c.id === prev)
              ? prev
              : data.cohorts[0].id
          );
        } else {
          setSelectedCohortId(null);
          setCohortDetail(null);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch teacher cohorts:', err);
    } finally {
      setIsLoadingCohorts(false);
    }
  }, []);

  const loadCohortDetail = useCallback(async (cohortId: string) => {
    setIsLoadingDetail(true);
    try {
      const token = AuthService.getStaffToken();
      const res = await fetch(`/api/cohorts/${encodeURIComponent(cohortId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && data.cohort) {
        setCohortDetail({
          cohort: data.cohort,
          members: data.members || [],
          assignments: data.assignments || [],
          submissions: data.submissions || [],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch cohort detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (isStaffAuthenticated) {
      loadCohorts();
    }
  }, [isStaffAuthenticated, loadCohorts]);

  useEffect(() => {
    if (isStaffAuthenticated && selectedCohortId) {
      loadCohortDetail(selectedCohortId);
    }
  }, [isStaffAuthenticated, selectedCohortId, loadCohortDetail]);

  const handleTeacherAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      const res = await AuthService.teacherAuth({
        mode: authTab,
        email,
        password,
        fullName: authTab === 'REGISTER' ? fullName : undefined,
        schoolName: authTab === 'REGISTER' ? schoolName : undefined,
        accessCode: accessCode || undefined,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsStaffAuthenticated(true);
      } else {
        setAuthError(res.error || 'Authentication failed.');
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;
    setIsCreatingCohort(true);
    try {
      const token = AuthService.getStaffToken();
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newCohortName,
          schoolName: newCohortSchool || currentUser?.schoolName || 'Partner Language School',
          targetBand: newCohortBand,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.cohort) {
        setNewCohortName('');
        setIsCreateOpen(false);
        setSelectedCohortId(data.cohort.id);
        await loadCohorts();
      }
    } finally {
      setIsCreatingCohort(false);
    }
  };

  const handleSeedDemoCohort = async () => {
    setIsSeedingDemo(true);
    try {
      const token = AuthService.getStaffToken();
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'SEED_DEMO' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.cohort) {
        setSelectedCohortId(data.cohort.id);
        await loadCohorts();
      }
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!selectedCohortId) return;
    const token = AuthService.getStaffToken();
    const res = await fetch(
      `/api/cohorts/${encodeURIComponent(selectedCohortId)}/assignments?assignmentId=${encodeURIComponent(assignmentId)}`,
      {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (res.ok) {
      await loadCohortDetail(selectedCohortId);
      await loadCohorts();
    }
  };

  const handleCopyInvite = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const activeCohortStats = cohorts.find((c) => c.id === selectedCohortId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Top Portal Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  B2B School &amp; Teacher Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                  Cohort Management
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Create student classes, assign official IELTS prompts, inspect annotated submissions, and leave coaching feedback
              </p>
            </div>
          </div>

          {isStaffAuthenticated && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  loadCohorts();
                  if (selectedCohortId) loadCohortDetail(selectedCohortId);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingCohorts || isLoadingDetail ? 'animate-spin text-indigo-500' : ''}`}
                />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen((v) => !v)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Create Cohort</span>
              </button>
            </div>
          )}
        </div>

        {/* Auth Guard */}
        {isCheckingAuth ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : !isStaffAuthenticated ? (
          <div className="max-w-lg mx-auto py-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-slate-200 dark:border-gray-700/80 shadow-2xl space-y-5">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-extrabold">School Instructor Access</h2>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Register a partner school instructor account or sign in to manage student cohorts.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('REGISTER');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'REGISTER'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-gray-300'
                  }`}
                >
                  Create Instructor Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('LOGIN');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'LOGIN'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-gray-300'
                  }`}
                >
                  Instructor Sign In
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleTeacherAuthSubmit} className="space-y-3.5">
                {authTab === 'REGISTER' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Nodira Alimova"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">School / Academy Name</label>
                      <input
                        type="text"
                        name="organization"
                        autoComplete="organization"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Tashkent Academic Prep"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">Instructor Email</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="instructor@school.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Password (min 6 chars)</label>
                  <input
                    type="password"
                    name="password"
                    autoComplete={authTab === 'LOGIN' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {authTab === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      School Access Code (if required by administrator)
                    </label>
                    <input
                      type="text"
                      name="accessCode"
                      autoComplete="off"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAuthSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {authTab === 'REGISTER' ? 'Launch Instructor Dashboard' : 'Sign In to Teacher Portal'}
                  </span>
                </button>
              </form>

              <p className="text-[11px] text-center text-slate-500 dark:text-gray-400">
                Platform administrators can also authenticate via{' '}
                <Link href="/admin" className="text-indigo-500 underline font-semibold">
                  Admin Dashboard
                </Link>{' '}
                to oversee all partner school cohorts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Inline Create Cohort Form */}
            {isCreateOpen && (
              <form
                onSubmit={handleCreateCohort}
                className="p-5 rounded-2xl glass-panel border border-indigo-200 dark:border-indigo-500/30 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1">Cohort Name</label>
                  <input
                    type="text"
                    required
                    value={newCohortName}
                    onChange={(e) => setNewCohortName(e.target.value)}
                    placeholder="e.g. Band 7.5 Evening Group B"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">School / Academy</label>
                  <input
                    type="text"
                    value={newCohortSchool}
                    onChange={(e) => setNewCohortSchool(e.target.value)}
                    placeholder={currentUser?.schoolName || 'Partner Language School'}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Target Band Goal</label>
                  <select
                    value={newCohortBand}
                    onChange={(e) => setNewCohortBand(e.target.value as TargetBand)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs font-bold"
                  >
                    {ALL_TARGET_BANDS.map((band) => (
                      <option key={band} value={band}>
                        Band {band}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isCreatingCohort}
                    className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5"
                  >
                    {isCreatingCohort && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Create</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-gray-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Empty Onboarding State */}
            {!isLoadingCohorts && cohorts.length === 0 ? (
              <div className="rounded-3xl glass-panel border border-slate-200 dark:border-gray-800 p-10 text-center space-y-4 max-w-2xl mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-500">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black">Create Your First Student Cohort</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    Launch an IELTS class to receive an instant 6-character student invite code,
                    assign official Writing Task 1 &amp; Task 2 homework, and inspect AI-graded essays.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Empty Cohort</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSeedDemoCohort}
                    disabled={isSeedingDemo}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSeedingDemo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Load Sample B2B Class</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Cohort Switcher */}
                <aside className="lg:col-span-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 px-1">
                    Your Cohorts ({cohorts.length})
                  </div>

                  {cohorts.map((cohort) => {
                    const isSelected = cohort.id === selectedCohortId;
                    return (
                      <button
                        key={cohort.id}
                        type="button"
                        onClick={() => setSelectedCohortId(cohort.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                            : 'glass-panel border-slate-200 dark:border-gray-800 hover:border-indigo-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {cohort.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-gray-400">
                              {cohort.schoolName}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold text-[10px] shrink-0">
                            Goal {cohort.targetBand}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-gray-400 pt-1 border-t border-slate-200/70 dark:border-gray-800">
                          <span>
                            {cohort.memberCount} students • {cohort.submissionCount} essays
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {cohort.joinCode}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </aside>

                {/* Right Column: Selected Cohort Console */}
                <section className="lg:col-span-8 space-y-5">
                  {cohortDetail && activeCohortStats && (
                    <>
                      {/* Cohort Summary & Invite Banner */}
                      <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                              {cohortDetail.cohort.name}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {cohortDetail.cohort.schoolName} • Instructor:{' '}
                              {cohortDetail.cohort.teacherName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyInvite(cohortDetail.cohort.joinCode, 'code')
                              }
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono flex items-center gap-1.5"
                            >
                              {copiedKey === 'code' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {copiedKey === 'code'
                                  ? 'Code Copied'
                                  : `Code: ${cohortDetail.cohort.joinCode}`}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const origin =
                                  typeof window !== 'undefined' ? window.location.origin : '';
                                handleCopyInvite(
                                  `${origin}/workspace?joinCode=${encodeURIComponent(cohortDetail.cohort.joinCode)}`,
                                  'link'
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-xs font-semibold flex items-center gap-1.5"
                            >
                              {copiedKey === 'link' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {copiedKey === 'link' ? 'Invite URL Copied' : 'Copy Student Join Link'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* KPI Mini Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-gray-800">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800">
                            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                              <Users className="h-3 w-3 text-indigo-500" />
                              Students
                            </div>
                            <div className="text-lg font-black mt-0.5">
                              {cohortDetail.members.length}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800">
                            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-amber-500" />
                              Assignments
                            </div>
                            <div className="text-lg font-black mt-0.5">
                              {cohortDetail.assignments.length}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800">
                            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                              <FileText className="h-3 w-3 text-sky-500" />
                              Submissions
                            </div>
                            <div className="text-lg font-black mt-0.5">
                              {cohortDetail.submissions.length}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800">
                            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                              <Award className="h-3 w-3 text-emerald-500" />
                              Avg Band
                            </div>
                            <div className="text-lg font-black mt-0.5 text-emerald-600 dark:text-emerald-400">
                              {activeCohortStats.averageBand !== null
                                ? activeCohortStats.averageBand.toFixed(1)
                                : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Console Tabs */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => setActiveTab('SUBMISSIONS')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                              activeTab === 'SUBMISSIONS'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Submissions ({cohortDetail.submissions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('ASSIGNMENTS')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                              activeTab === 'ASSIGNMENTS'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Assignments ({cohortDetail.assignments.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('ROSTER')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                              activeTab === 'ROSTER'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Students Roster ({cohortDetail.members.length})
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Assign Writing Task</span>
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeTab === 'SUBMISSIONS' && (
                        <div className="space-y-3">
                          {cohortDetail.submissions.length === 0 ? (
                            <div className="p-8 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 text-center space-y-2 text-xs text-slate-500 dark:text-gray-400">
                              <p className="font-bold text-slate-800 dark:text-gray-200">
                                No student submissions yet
                              </p>
                              <p>
                                Share invite code{' '}
                                <span className="font-mono font-bold text-indigo-500">
                                  {cohortDetail.cohort.joinCode}
                                </span>{' '}
                                with students so their evaluated essays appear here for review.
                              </p>
                            </div>
                          ) : (
                            cohortDetail.submissions.map((sub) => (
                              <div
                                key={sub.id}
                                className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                      {sub.studentName}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                      Band {sub.overallBand.toFixed(1)}
                                    </span>
                                    {sub.teacherFeedback ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                        Reviewed ✓
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400">
                                        Pending Feedback
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                                    {sub.promptTitle}
                                  </div>

                                  <div className="text-[11px] text-slate-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                                    <span>{sub.wordCount} words</span>
                                    <span>•</span>
                                    <span>
                                      TA {sub.taskResponseScore.toFixed(1)} / CC{' '}
                                      {sub.coherenceScore.toFixed(1)} / LR{' '}
                                      {sub.lexicalScore.toFixed(1)} / GRA{' '}
                                      {sub.grammarScore.toFixed(1)}
                                    </span>
                                    <span>•</span>
                                    <span suppressHydrationWarning>
                                      {new Date(sub.submittedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>

                                  {sub.teacherFeedback && (
                                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/30 px-2.5 py-1.5 rounded-lg border border-indigo-200/70 dark:border-indigo-800/40 flex items-start gap-1.5">
                                      <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2">{sub.teacherFeedback}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Link
                                    href={`/report/${encodeURIComponent(sub.reportId)}`}
                                    target="_blank"
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-xs"
                                    title="Open public report certificate"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setReviewSubmission(sub)}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Inspect &amp; Review</span>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'ASSIGNMENTS' && (
                        <div className="space-y-3">
                          {cohortDetail.assignments.length === 0 ? (
                            <div className="p-8 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 text-center space-y-3 text-xs text-slate-500 dark:text-gray-400">
                              <p className="font-bold text-slate-800 dark:text-gray-200">
                                No prompts assigned to this cohort yet
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsAssignModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Assign First Writing Task</span>
                              </button>
                            </div>
                          ) : (
                            cohortDetail.assignments.map((assign) => (
                              <div
                                key={assign.id}
                                className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 flex items-start justify-between gap-4"
                              >
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                      {assign.prompt.title}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-[10px] font-bold">
                                      {assign.prompt.type === 'TASK_2_ESSAY'
                                        ? 'Task 2 Essay'
                                        : assign.prompt.type === 'TASK_1_ACADEMIC'
                                        ? 'Academic Task 1'
                                        : 'General Task 1'}
                                    </span>
                                    {assign.dueDate && (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[10px] font-semibold flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Due {assign.dueDate}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-gray-300">
                                    {assign.prompt.questionText}
                                  </p>
                                  {assign.teacherNotes && (
                                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg">
                                      <strong>Teacher Focus:</strong> {assign.teacherNotes}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(assign.id)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                                  title="Remove assignment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'ROSTER' && (
                        <div className="space-y-3">
                          {cohortDetail.members.length === 0 ? (
                            <div className="p-8 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 text-center text-xs text-slate-500 dark:text-gray-400">
                              No students have enrolled yet. Share join code{' '}
                              <span className="font-mono font-bold text-indigo-500">
                                {cohortDetail.cohort.joinCode}
                              </span>{' '}
                              or click &ldquo;Copy Student Join Link&rdquo; above.
                            </div>
                          ) : (
                            cohortDetail.members.map((member) => {
                              const studentSubs = cohortDetail.submissions.filter(
                                (s) => s.studentId === member.studentId
                              );
                              const avgScore =
                                studentSubs.length > 0
                                  ? (
                                      studentSubs.reduce((a, b) => a + b.overallBand, 0) /
                                      studentSubs.length
                                    ).toFixed(1)
                                  : null;

                              return (
                                <div
                                  key={member.id}
                                  className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-4 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                                      {member.studentName}
                                    </div>
                                    <div className="text-slate-500 dark:text-gray-400">
                                      {member.studentEmail || member.studentId} • Joined{' '}
                                      <span suppressHydrationWarning>
                                        {new Date(member.joinedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {studentSubs.length} submission{studentSubs.length === 1 ? '' : 's'}
                                    </div>
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {avgScore ? `Avg Band ${avgScore}` : 'No submissions yet'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedCohortId && cohortDetail && (
        <AssignPromptModal
          isOpen={isAssignModalOpen}
          cohortId={selectedCohortId}
          cohortName={cohortDetail.cohort.name}
          onClose={() => setIsAssignModalOpen(false)}
          onAssigned={() => {
            loadCohortDetail(selectedCohortId);
            loadCohorts();
            setActiveTab('ASSIGNMENTS');
          }}
        />
      )}

      {selectedCohortId && (
        <CohortSubmissionReviewModal
          cohortId={selectedCohortId}
          submission={reviewSubmission}
          onClose={() => setReviewSubmission(null)}
          onFeedbackSaved={(updated) => {
            setReviewSubmission(updated);
            loadCohortDetail(selectedCohortId);
          }}
        />
      )}

      <AuthModals />
    </div>
  );
}

