'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  Ban,
  CheckCircle2,
  FileText,
  HelpCircle,
  Pause,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

type FlowStage = 0 | 1 | 2;

const STAGES: {
  id: FlowStage;
  step: string;
  label: string;
  bandEstimate: string;
  caption: string;
}[] = [
  {
    id: 0,
    step: '01',
    label: 'You Write',
    bandEstimate: '6.5',
    caption: 'Live detection spots weak Band 6.0 phrasing while you draft',
  },
  {
    id: 1,
    step: '02',
    label: 'Mentor Guides',
    bandEstimate: '7.5',
    caption: 'Socratic questions challenge your word choice without rewriting',
  },
  {
    id: 2,
    step: '03',
    label: 'Dual-Layer Verdict',
    bandEstimate: '8.0',
    caption: 'Objective Examiner Band Score + Target Alignment Audit on submit',
  },
];

const UPGRADE_OPTIONS = [
  {
    id: 'authority',
    phrase: 'exercise decisive authority',
    note: 'Precise policy collocation (+1.5 Lexical Resource)',
  },
  {
    id: 'regulation',
    phrase: 'enforce binding regulation',
    note: 'Formal academic register (+1.5 Lexical Resource)',
  },
] as const;

const CRITERION_SCORES = [
  { code: 'TR', label: 'Task Response', score: 8.0, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  { code: 'CC', label: 'Coherence & Cohesion', score: 7.5, color: 'bg-sky-500', textColor: 'text-sky-600 dark:text-sky-400' },
  { code: 'LR', label: 'Lexical Resource', score: 8.0, color: 'bg-purple-500', textColor: 'text-purple-600 dark:text-purple-400' },
  { code: 'GRA', label: 'Grammar Accuracy', score: 7.5, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
];

const STAGE_DURATION_MS = 4800;

export const SocraticBusinessFlow: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState<FlowStage>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<'authority' | 'regulation' | null>(null);

  const autoPlayActive = !isPaused && !isHoverPaused && !prefersReducedMotion;

  useEffect(() => {
    if (!autoPlayActive) return;

    const timer = window.setInterval(() => {
      setStage((prev) => {
        const next = ((prev + 1) % 3) as FlowStage;
        if (next === 0) {
          setSelectedUpgradeId(null);
        }
        return next;
      });
    }, STAGE_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [autoPlayActive]);

  // In stage 1, automatically demonstrate student choosing an academic upgrade partway through
  useEffect(() => {
    if (stage !== 1 || !autoPlayActive || selectedUpgradeId !== null) return;

    const upgradeTimer = window.setTimeout(() => {
      setSelectedUpgradeId('authority');
    }, 2100);

    return () => window.clearTimeout(upgradeTimer);
  }, [stage, autoPlayActive, selectedUpgradeId]);

  const activeUpgrade = UPGRADE_OPTIONS.find((opt) => opt.id === selectedUpgradeId) ?? null;

  const displayedBand =
    stage === 0 ? '6.5' : stage === 1 ? (activeUpgrade ? '7.5' : '6.5') : '8.0';

  const handleSelectStage = (nextStage: FlowStage) => {
    setStage(nextStage);
    if (nextStage === 0) {
      setSelectedUpgradeId(null);
    } else if (nextStage === 2 && !selectedUpgradeId) {
      setSelectedUpgradeId('authority');
    }
  };

  return (
    <div
      className="glass-panel rounded-3xl p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-2xl relative overflow-hidden"
      onMouseEnter={() => setIsHoverPaused(true)}
      onMouseLeave={() => setIsHoverPaused(false)}
    >
      {/* Top Window Chrome: Business Goal & Live Band Meter */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            <Target className="h-3 w-3 shrink-0" />
            <span>Goal: Band 8.0</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            0% Copy-Paste
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Animated Live Readiness Readout */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-gray-800/90 border border-slate-200 dark:border-gray-700">
            <TrendingUp className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold">Est.</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={displayedBand}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
                className={`text-xs font-black tabular-nums ${
                  displayedBand === '8.0'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : displayedBand === '7.5'
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {displayedBand}
              </motion.span>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 transition-colors"
            aria-label={isPaused ? 'Resume walkthrough animation' : 'Pause walkthrough animation'}
            title={isPaused ? 'Resume walkthrough' : 'Pause walkthrough'}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Canvas */}
      <div className="flex flex-col justify-between">
        <div className="h-[345px] sm:h-[315px] overflow-hidden flex flex-col justify-start">
          <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="stage-write"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3.5"
            >
              {/* Prompt Header */}
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-800 flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    IELTS Task 2 Essay Prompt
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-gray-200">
                    &quot;Should governments impose strict taxes on heavy industry to curb carbon emissions?&quot;
                  </p>
                </div>
              </div>

              {/* Live Essay Editor Box */}
              <div className="relative p-4 rounded-2xl bg-white dark:bg-gray-950/90 border border-slate-200 dark:border-gray-800 shadow-inner space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500 dark:text-gray-400">Body Paragraph 1</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Scanning vs Band 8.0 rubric...
                  </motion.span>
                </div>

                <p className="text-sm leading-relaxed text-slate-800 dark:text-gray-100">
                  Furthermore, governments must{' '}
                  <motion.span
                    initial={{ backgroundColor: 'rgba(245, 158, 11, 0)' }}
                    animate={{ backgroundColor: 'rgba(245, 158, 11, 0.18)' }}
                    transition={{ delay: 0.55, duration: 0.45 }}
                    className="relative inline-block px-1.5 py-0.5 rounded-md font-semibold text-amber-800 dark:text-amber-200 border-b-2 border-amber-500"
                  >
                    play an important role
                  </motion.span>{' '}
                  in curbing industrial carbon emissions before environmental damage becomes irreversible.
                  {!prefersReducedMotion && (
                    <motion.span
                      aria-hidden="true"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-brand-500 align-middle ml-1"
                    />
                  )}
                </p>

                {/* Live Diagnostic Callout */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.35 }}
                  className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      Opportunity Spotted: Vague Collocation
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-gray-300">
                      &quot;play an important role&quot; is common at Band 6.0. Preparing Socratic prompt...
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black px-2 py-1 rounded-md bg-amber-500 text-gray-950">
                    LR Check
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="stage-mentor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Student Essay Live Morphing Sentence */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-950/90 border border-slate-200 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  <span>Your Draft (Live Update)</span>
                  <span className={activeUpgrade ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {activeUpgrade ? 'Student-Authored Upgrade ✓' : 'Awaiting Your Choice'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-gray-100">
                  Furthermore, governments must{' '}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeUpgrade ? activeUpgrade.id : 'weak'}
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      className={`inline-block px-1.5 py-0.5 rounded-md font-bold border-b-2 ${
                        activeUpgrade
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500'
                      }`}
                    >
                      {activeUpgrade ? activeUpgrade.phrase : 'play an important role'}
                    </motion.span>
                  </AnimatePresence>{' '}
                  in curbing industrial carbon emissions.
                </p>
              </div>

              {/* Connecting Signal Badge */}
              <div className="flex items-center justify-center">
                <div className="h-4 w-0.5 bg-gradient-to-b from-amber-500 to-brand-500 rounded-full" />
              </div>

              {/* Socratic Question Card (Never Copy-Paste) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/95 via-indigo-50/90 to-white dark:from-brand-950/55 dark:via-indigo-950/45 dark:to-gray-900 border border-brand-300/80 dark:border-brand-500/40 shadow-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
                    <HelpCircle className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Socratic Mentor Question</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20">
                    <Ban className="h-2.5 w-2.5" />
                    No AI Rewrites
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed">
                  &quot;To hit Band 8.0 Vocabulary, which precise verb + noun shows <strong>how</strong> governments enforce climate rules?&quot;
                </p>

                {/* Interactive Student Self-Upgrade Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {UPGRADE_OPTIONS.map((option) => {
                    const isSelected = selectedUpgradeId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedUpgradeId(option.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                            : 'bg-white/80 dark:bg-gray-900/70 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-brand-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                          <span>&quot;{option.phrase}&quot;</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                          {option.note}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="stage-verdict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Layer 1: Official 4-Criterion Examiner Breakdown */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-950/90 border border-slate-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Layer 1: Objective Examiner Report
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400">
                        Official 4-Criterion Rounding
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-gray-950 font-black text-sm shadow-md shadow-amber-500/25"
                  >
                    Band 8.0
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CRITERION_SCORES.map((item, idx) => (
                    <div key={item.code} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-gray-300">
                          {item.label}
                        </span>
                        <span className={`font-black tabular-nums ${item.textColor}`}>
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: item.score / 9 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.12 + idx * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{ transformOrigin: 'left' }}
                          className={`h-full w-full rounded-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 2: Target Alignment Audit */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-brand-500/10 border border-emerald-500/30 flex items-start gap-3"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Layer 2: Target Alignment Audit</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Target 8.0 Met
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-gray-300 leading-relaxed">
                    Upgrading your phrasing closed the Lexical gap. Next target to push 8.5: vary complex passive structures in Paragraph 3.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Interactive 3-Step Flow Navigation Bar with Live Progress Indicator */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-gray-800 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 dark:bg-gray-900/90 p-1 rounded-xl border border-slate-200 dark:border-gray-800">
            {STAGES.map((item) => {
              const isActive = stage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectStage(item.id)}
                  className={`relative py-2 px-2 rounded-lg text-[11px] font-bold transition-colors text-center ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="hero-flow-active-tab"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 shadow-sm"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    <span className="opacity-80">{item.step}</span>
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
              {STAGES[stage].caption}
            </p>
            {/* Active Stage Auto-Progress Track */}
            <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-gray-800 overflow-hidden shrink-0">
              {autoPlayActive ? (
                <motion.div
                  key={`progress-${stage}-${isPaused}-${isHoverPaused}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: STAGE_DURATION_MS / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                  className="h-full w-full bg-brand-500"
                />
              ) : (
                <div className="h-full w-full bg-brand-500/60" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

