'use client';

import React, { useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { ALL_TARGET_BANDS, OFFICIAL_IELTS_RUBRICS } from '@/lib/ielts-rubric';
import { TargetBand, AssistanceMode } from '@/types/ielts';
import { 
  Sparkles, 
  Target, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Key, 
  RotateCcw, 
  HelpCircle,
  Zap,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  onOpenPromptsModal: () => void;
  onOpenApiKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPromptsModal, onOpenApiKeyModal }) => {
  const { 
    targetBand, 
    setTargetBand, 
    assistanceMode, 
    setAssistanceMode, 
    currentPrompt,
    resetSession,
    geminiApiKey
  } = useWritingStore();

  const [hoveredBand, setHoveredBand] = useState<TargetBand | null>(null);

  const handleBandChange = (newBand: TargetBand) => {
    setTargetBand(newBand);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Branding & Current Prompt Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">IELTS Mentor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Adaptive AI
                </span>
              </div>
              <p className="text-xs text-gray-400">Official-Grade Writing Platform</p>
            </div>
          </div>

          <button
            onClick={onOpenPromptsModal}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/60 transition-all"
            title="Change IELTS Task Prompt"
          >
            <BookOpen className="h-3.5 w-3.5 text-brand-400" />
            <span className="max-w-[140px] truncate">{currentPrompt.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-900/60 text-brand-300">
              {currentPrompt.type === 'TASK_2_ESSAY' ? 'Task 2' : 'Task 1'}
            </span>
          </button>
        </div>

        {/* Center: Dynamic Target Band & Mode Controls */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          
          {/* Target Band Picker with Dynamic Recalibration */}
          <div className="relative group flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-gray-300">
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span>Target Band:</span>
            </div>

            <div className="flex items-center gap-1">
              {ALL_TARGET_BANDS.map((band) => (
                <button
                  key={band}
                  onClick={() => handleBandChange(band)}
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
                  <span>Band {hoveredBand} Official Standard</span>
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

          {/* Assistance Mode Toggle (Workflow 2.2) */}
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

        {/* Right: API Key Settings & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              geminiApiKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>{geminiApiKey ? 'Gemini Key Configured' : 'Configure Gemini Key'}</span>
          </button>

          <button
            onClick={resetSession}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white border border-gray-700/60 transition-all"
            title="Reset Essay Draft"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
