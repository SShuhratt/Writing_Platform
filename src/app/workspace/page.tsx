'use client';

import React, { useState, useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateSubmissionEvaluation } from '@/lib/ai-service';
import { Navbar } from '@/components/Navbar';
import { EditorSurface } from '@/components/EditorSurface';
import { SocraticSidePanel } from '@/components/SocraticSidePanel';
import { PromptSelectorModal } from '@/components/PromptSelectorModal';
import { DualLayerReportModal } from '@/components/DualLayerReportModal';
import { AuthModals } from '@/components/auth/AuthModals';
import { AuthService } from '@/lib/auth-service';

import Link from 'next/link';
import { 
  Lock, 
  LogIn, 
  UserPlus, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

export default function WorkspacePage() {
  const {
    currentUser,
    setAuthModalMode,
    essayText,
    targetBand,
    assistanceMode,
    currentPrompt,
    setCurrentUser,
    isSubmitting,
    setIsSubmitting,
    activeReport,
    setActiveReport
  } = useWritingStore();

  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Load User from Session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = AuthService.getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
      setIsCheckingAuth(false);
    }
  }, [setCurrentUser]);

  // Handle Essay Submission & Dual-Layer Assessment
  const handleSubmitTask = async () => {
    if (!essayText.trim()) return;

    setIsSubmitting(true);
    try {
      const report = await generateSubmissionEvaluation({
        essayText,
        targetBand,
        prompt: currentPrompt,
        mode: assistanceMode,
      });

      setActiveReport(report);
    } catch (err) {
      console.error('Submission evaluation error:', err);
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
          
          {/* Left/Center 8 cols: Editor Surface Canvas */}
          <section className="lg:col-span-8 h-full">
            <EditorSurface
              onSubmitTask={handleSubmitTask}
              onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
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

      <AuthModals />
    </div>
  );
}
