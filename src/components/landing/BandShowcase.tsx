'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TargetBand } from '@/types/ielts';
import { ALL_TARGET_BANDS, OFFICIAL_IELTS_RUBRICS } from '@/lib/ielts-rubric';
import { Target, CheckCircle2, BookOpen, Layers, Award } from 'lucide-react';

export const BandShowcase: React.FC = () => {
  const [selectedBand, setSelectedBand] = useState<TargetBand>('7.5');

  const currentRubric = OFFICIAL_IELTS_RUBRICS[selectedBand];
  const numericBand = Number(selectedBand);
  const calibrationRatio = Math.min(1, Math.max(0.2, numericBand / 9));

  const criteria = [
    {
      key: 'taskResponse',
      title: 'Task Achievement / Response',
      icon: Award,
      iconColor: 'text-amber-500',
      barColor: 'bg-amber-500',
      badgeClass:
        'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
      text: currentRubric.taskResponse,
    },
    {
      key: 'coherenceCohesion',
      title: 'Coherence & Cohesion',
      icon: Layers,
      iconColor: 'text-sky-500',
      barColor: 'bg-sky-500',
      badgeClass:
        'text-sky-700 dark:text-sky-400 bg-sky-500/15 border-sky-500/30',
      text: currentRubric.coherenceCohesion,
    },
    {
      key: 'lexicalResource',
      title: 'Lexical Resource',
      icon: BookOpen,
      iconColor: 'text-purple-500',
      barColor: 'bg-purple-500',
      badgeClass:
        'text-purple-700 dark:text-purple-400 bg-purple-500/15 border-purple-500/30',
      text: currentRubric.lexicalResource,
    },
    {
      key: 'grammaticalAccuracy',
      title: 'Grammatical Range & Accuracy',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      badgeClass:
        'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      text: currentRubric.grammaticalAccuracy,
    },
  ] as const;

  return (
    <section className="py-16 bg-slate-100/60 dark:bg-gray-900/40 border-y border-slate-200 dark:border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-amber-500" />
            <span>Interactive Band Calibration</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ground Every Live Suggestion in Official IELTS Criteria
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Select your goal band below to see how strictness and scoring rules tighten across all four official IELTS dimensions.
          </p>
        </div>

        {/* Band Selector Buttons with Sliding Pill */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {ALL_TARGET_BANDS.map((band) => {
            const isSelected = selectedBand === band;
            return (
              <button
                key={band}
                type="button"
                onClick={() => setSelectedBand(band)}
                className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  isSelected
                    ? 'text-gray-950'
                    : 'glass-card text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="band-showcase-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30"
                  />
                )}
                <span className="relative z-10">Band {band}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Rubric Criteria Display Cards with Live Strictness Meter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {criteria.map((criterion) => {
            const Icon = criterion.icon;
            return (
              <div
                key={criterion.key}
                className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${criterion.iconColor}`} />
                    {criterion.title}
                  </h4>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md border tabular-nums ${criterion.badgeClass}`}
                  >
                    Band {selectedBand}
                  </span>
                </div>

                {/* Animated Strictness Calibration Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-gray-800 overflow-hidden">
                    <motion.div
                      animate={{ scaleX: calibrationRatio }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: 'left' }}
                      className={`h-full w-full rounded-full ${criterion.barColor}`}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${criterion.key}-${selectedBand}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed min-h-[48px]"
                  >
                    {criterion.text}
                  </motion.p>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
