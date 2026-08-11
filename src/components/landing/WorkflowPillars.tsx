'use client';

import React from 'react';
import { Target, Zap, Award, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

export const WorkflowPillars: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            <span>3-Step Pedagogical Workflow</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Designed for Cognitive Flow & Rapid Score Growth
          </h2>
          <p className="text-sm text-gray-400">
            A structured learning experience built to bridge the gap between your current drafting and your dream IELTS band score.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-4 relative group hover:border-brand-500/50 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-black text-xl">
              1
            </div>
            <h3 className="font-bold text-lg text-white">Set Target & Prompt</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Choose your target band score (5.0 to 9.0) and select from official Task 1 Academic, Task 1 General, or Task 2 Essay prompts.
            </p>
            <ul className="space-y-2 text-xs text-gray-400 pt-2 border-t border-gray-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                <span>Task 1 & Task 2 prompts database</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                <span>Custom question prompt creation</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-4 relative group hover:border-amber-500/50 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
              2
            </div>
            <h3 className="font-bold text-lg text-white">Real-Time Socratic Drafting</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Receive live, non-intrusive conceptual questions after topic sentences, 2 sentences, 50 words, and paragraph completion.
            </p>
            <ul className="space-y-2 text-xs text-gray-400 pt-2 border-t border-gray-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                <span>0% copy-paste text rewrites</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Adaptive mid-task level offers</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-3xl glass-panel border border-gray-800 space-y-4 relative group hover:border-emerald-500/50 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
              3
            </div>
            <h3 className="font-bold text-lg text-white">Dual-Layer Assessment</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Upon submission, get an Objective Examiner Band Score (1.0–9.0) plus a Target Alignment Audit with an actionable gap roadmap.
            </p>
            <ul className="space-y-2 text-xs text-gray-400 pt-2 border-t border-gray-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Official IELTS band score rounding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Print & PDF export options</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};
