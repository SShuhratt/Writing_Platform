'use client';

import React, { useState } from 'react';
import { TargetBand } from '@/types/ielts';
import { ALL_TARGET_BANDS, OFFICIAL_IELTS_RUBRICS } from '@/lib/ielts-rubric';
import { Target, CheckCircle2, BookOpen, Layers, Award } from 'lucide-react';

export const BandShowcase: React.FC = () => {
  const [selectedBand, setSelectedBand] = useState<TargetBand>('7.5');

  const currentRubric = OFFICIAL_IELTS_RUBRICS[selectedBand];

  return (
    <section className="py-16 bg-gray-900/40 border-y border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Target className="h-3.5 w-3.5" />
            <span>Interactive Band Standards</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Ground Every Live Suggestion in Official IELTS Criteria
          </h2>
          <p className="text-sm text-gray-400">
            Select a target band score below to see how our AI Socratic engine calibrates feedback across all four official IELTS writing dimensions.
          </p>
        </div>

        {/* Band Selector Buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {ALL_TARGET_BANDS.map((band) => (
            <button
              key={band}
              onClick={() => setSelectedBand(band)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                selectedBand === band
                  ? 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/30 scale-105'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              Band {band}
            </button>
          ))}
        </div>

        {/* 4 Rubric Criteria Display Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* TA / TR */}
          <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Task Achievement / Response
              </h4>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                Band {selectedBand}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {currentRubric.taskResponse}
            </p>
          </div>

          {/* CC */}
          <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                Coherence & Cohesion
              </h4>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                Band {selectedBand}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {currentRubric.coherenceCohesion}
            </p>
          </div>

          {/* LR */}
          <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" />
                Lexical Resource
              </h4>
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                Band {selectedBand}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {currentRubric.lexicalResource}
            </p>
          </div>

          {/* GRA */}
          <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Grammatical Range & Accuracy
              </h4>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                Band {selectedBand}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {currentRubric.grammaticalAccuracy}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
