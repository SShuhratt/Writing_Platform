'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWritingStore } from '@/lib/store';
import { ALL_TARGET_BANDS, OFFICIAL_IELTS_RUBRICS } from '@/lib/ielts-rubric';
import { TargetBand } from '@/types/ielts';
import { 
  Sparkles, 
  Target, 
  EyeOff, 
  BookOpen, 
  Key, 
  RotateCcw, 
  Zap,
  GraduationCap,
  LogIn,
  UserCheck,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  PenTool
} from 'lucide-react';

interface NavbarProps {
  onOpenPromptsModal?: () => void;
  onOpenApiKeyModal?: () => void;
  isWorkspace?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenPromptsModal, 
  onOpenApiKeyModal,
  isWorkspace = false 
}) => {
  const { 
    targetBand, 
    setTargetBand, 
    assistanceMode, 
    setAssistanceMode, 
    currentPrompt,
    resetSession,
    geminiApiKey,
    currentUser,
    logout,
    setAuthModalMode
  } = useWritingStore();

  const [hoveredBand, setHoveredBand] = useState<TargetBand | null>(null);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Branding & Current Prompt Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-all">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">IELTS Mentor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Adaptive AI
                </span>
              </div>
              <p className="text-xs text-gray-400">Official-Grade Platform</p>
            </div>
          </Link>

          {isWorkspace && onOpenPromptsModal && (
            <button
              onClick={onOpenPromptsModal}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/60 transition-all"
              title="Change IELTS Task Prompt"
            >
              <BookOpen className="h-3.5 w-3.5 text-brand-400" />
              <span className="max-w-[130px] truncate">{currentPrompt.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-900/60 text-brand-300">
                {currentPrompt.type === 'TASK_2_ESSAY' ? 'Task 2' : 'Task 1'}
              </span>
            </button>
          )}
        </div>

        {/* Center: Dynamic Target Band & Mode Controls (When in Workspace) */}
        {isWorkspace ? (
          <div className="flex items-center gap-4 flex-wrap justify-center">
            
            {/* Target Band Picker */}
            <div className="relative group flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-gray-300">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                <span>Target:</span>
              </div>

              <div className="flex items-center gap-1">
                {ALL_TARGET_BANDS.map((band) => (
                  <button
                    key={band}
                    onClick={() => setTargetBand(band)}
                    onMouseEnter={() => setHoveredBand(band)}
                    onMouseLeave={() => setHoveredBand(null)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      targetBand === band
                        ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/30 scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>

              {/* Rubric Hover Preview Tooltip */}
              {hoveredBand && (
                <div className="absolute top-full left-0 mt-2 w-80 p-3 rounded-xl bg-gray-900 border border-amber-500/30 shadow-2xl text-xs text-gray-300 z-50 pointer-events-none">
                  <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                    <span>Band {hoveredBand} Standard</span>
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <div className="space-y-1.5 text-[11px] text-gray-400">
                    <p><strong className="text-gray-200">TA/TR:</strong> {OFFICIAL_IELTS_RUBRICS[hoveredBand].taskResponse}</p>
                    <p><strong className="text-gray-200">CC:</strong> {OFFICIAL_IELTS_RUBRICS[hoveredBand].coherenceCohesion}</p>
                    <p><strong className="text-gray-200">LR:</strong> {OFFICIAL_IELTS_RUBRICS[hoveredBand].lexicalResource}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setAssistanceMode('ACTIVE_ASSISTANT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  assistanceMode === 'ACTIVE_ASSISTANT'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Active Mentor</span>
              </button>

              <button
                onClick={() => setAssistanceMode('FOCUS_EXAM')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  assistanceMode === 'FOCUS_EXAM'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Focus Exam</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-300">
            <Link href="/workspace" className="flex items-center gap-1.5 hover:text-brand-300 transition-colors">
              <PenTool className="h-4 w-4 text-brand-400" />
              <span>Practice Workspace</span>
            </Link>
            {currentUser?.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-1.5 hover:text-amber-300 transition-colors">
                <LayoutDashboard className="h-4 w-4 text-amber-400" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>
        )}

        {/* Right: API Key & Authentication User Menu */}
        <div className="flex items-center gap-2">
          {isWorkspace && onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                geminiApiKey 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span>{geminiApiKey ? 'Gemini Key Configured' : 'Key Config'}</span>
            </button>
          )}

          {isWorkspace && (
            <button
              onClick={resetSession}
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white border border-gray-700/60 transition-all"
              title="Reset Essay Draft"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {/* User Auth Profile / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="flex items-center gap-2 bg-gray-900/90 px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                ) : (
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                )}
                <span className="font-bold text-white max-w-[100px] truncate">{currentUser.username}</span>
                {currentUser.role === 'admin' && (
                  <Link href="/admin" className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                    ADMIN
                  </Link>
                )}
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-lg bg-gray-800/80 hover:bg-rose-950/60 text-gray-400 hover:text-rose-300 border border-gray-700/60 transition-all"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalMode('LOGIN')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
