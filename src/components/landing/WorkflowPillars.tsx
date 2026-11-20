'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Ban,
  CheckCircle2,
  HelpCircle,
  Target,
  Zap,
} from 'lucide-react';

const FLOW_STEPS = [
  {
    step: '1',
    title: 'Set Target & Prompt',
    description:
      'Choose your target band score (5.0 to 9.0) and pick from Task 1 Academic, Task 1 General, or Task 2 Essay prompts.',
    accentBorder: 'hover:border-brand-500/50',
    badgeClass:
      'bg-brand-500/10 dark:bg-brand-600/20 border-brand-500/30 text-brand-600 dark:text-brand-400',
    checkColor: 'text-brand-500 dark:text-brand-400',
    bullets: [
      'Official Task 1 & Task 2 prompt library',
      'Custom prompt creation & classroom assignments',
    ],
    visual: (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200/80 dark:border-gray-800 flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-gray-200">
          <Target className="h-3.5 w-3.5 text-brand-500" />
          Target: Band 8.0
        </span>
        <span className="px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold text-[10px]">
          Task 2 Essay
        </span>
      </div>
    ),
  },
  {
    step: '2',
    title: 'Real-Time Socratic Drafting',
    description:
      'Receive non-intrusive guiding questions after topic sentences, 30 words, or completed paragraphs—never pre-written answers.',
    accentBorder: 'hover:border-amber-500/50',
    badgeClass:
      'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
    checkColor: 'text-amber-500 dark:text-amber-400',
    bullets: [
      '0% copy-paste text rewrites',
      'Builds real exam-day thinking habits',
    ],
    visual: (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200/80 dark:border-gray-800 grid grid-cols-2 gap-2 text-[10px] font-bold">
        <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 line-through">
          <Ban className="h-3 w-3 shrink-0" />
          AI Rewrite
        </span>
        <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <HelpCircle className="h-3 w-3 shrink-0" />
          Socratic Hint
        </span>
      </div>
    ),
  },
  {
    step: '3',
    title: 'Dual-Layer Assessment',
    description:
      'Upon submission, receive an Objective Examiner Band Score (1.0–9.0) alongside a Target Alignment Audit and gap roadmap.',
    accentBorder: 'hover:border-emerald-500/50',
    badgeClass:
      'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    checkColor: 'text-emerald-500 dark:text-emerald-400',
    bullets: [
      'Official IELTS 0.5-band rounding',
      'Shareable report link & PDF export',
    ],
    visual: (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950/70 border border-slate-200/80 dark:border-gray-800 flex items-center justify-between gap-2 text-[10px] font-bold">
        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
          <Award className="h-3.5 w-3.5 text-amber-500" />
          L1: Score 8.0
        </span>
        <span className="h-3 w-px bg-slate-300 dark:bg-gray-700" />
        <span className="text-emerald-700 dark:text-emerald-300">
          L2: Target Audit ✓
        </span>
      </div>
    ),
  },
];

export const WorkflowPillars: React.FC = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            <span>3-Step Pedagogical Workflow</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Designed for Cognitive Flow &amp; Rapid Score Growth
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            A clear three-stage loop built to turn everyday writing practice into measurable IELTS band progression.
          </p>
        </div>

        {/* Connected 3 Step Cards */}
        <div className="relative">
          {/* Desktop Animated Flow Connector Line behind the step badges */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-14 left-[16%] right-[16%] h-0.5 bg-slate-200 dark:bg-gray-800 pointer-events-none"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-gradient-to-r from-brand-500 via-amber-500 to-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {FLOW_STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`p-8 rounded-3xl glass-panel border border-slate-200 dark:border-gray-800 space-y-4 relative group ${item.accentBorder} transition-colors flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center font-black text-xl ${item.badgeClass}`}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {item.visual}

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-gray-400 pt-3 border-t border-slate-200 dark:border-gray-800">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.checkColor}`} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
