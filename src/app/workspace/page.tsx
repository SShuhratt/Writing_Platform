'use client';

import React, { useState, useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateSubmissionEvaluation } from '@/lib/ai-service';
import { Navbar } from '@/components/Navbar';
import { EditorSurface } from '@/components/EditorSurface';
import { SocraticSidePanel } from '@/components/SocraticSidePanel';
import { ApiKeyModal } from '@/components/ApiKeyModal';
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
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Zap,
  GraduationCap
} from 'lucide-react';

export default function WorkspacePage() {
  const {
    currentUser,
    setAuthModalMode,
    essayText,
    targetBand,
    assistanceMode,
    currentPrompt,
    geminiApiKey,
    setGeminiApiKey,
    setCurrentUser,
    isSubmitting,
    setIsSubmitting,
    activeReport,
    setActiveReport
  } = useWritingStore();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Load API Key & User from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ielts_gemini_api_key');
      if (storedKey) {
        setGeminiApiKey(storedKey);
      }
      const user = AuthService.getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
      setIsCheckingAuth(false);
    }
  }, [setGeminiApiKey, setCurrentUser]);

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
        apiKey: geminiApiKey,
      });

      setActiveReport(report);
    } catch (err) {
      console.error('Submission evaluation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const res = AuthService.login('testuser@gmail.com', 'testuser1');
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Workspace Navbar Header */}
      <Navbar
        isWorkspace
        onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
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
            
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 mx-auto">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                Practice Workspace Access
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Sign In Required to Practice
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Please sign in or register an account to enter the Practice Workspace, receive real-time Socratic mentorship, and access official Dual-Layer assessment reports.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 text-left space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Real-time Socratic feedback tuned to your Target Band (5.0–9.0)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Anti-Paste Learning Guard to build authentic test-day speed</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Official PDF assessment reports & one-click Telegram sharing</span>
              </div>
            </div>

            {/* Main Action Buttons */}
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

            {/* Fast Demo Login Option */}
            <div className="pt-2 border-t border-slate-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                onClick={handleQuickDemoLogin}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Quick Demo Login (testuser@gmail.com)</span>
              </button>

              <Link
                href="/"
                className="text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
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
            <EditorSurface onSubmitTask={handleSubmitTask} />
          </section>

          {/* Right 4 cols: Real-Time Socratic Guidance Panel */}
          <section className="lg:col-span-4 h-full">
            <SocraticSidePanel />
          </section>

        </main>
      )}

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

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
