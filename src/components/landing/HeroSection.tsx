'use client';

import React from 'react';
import Link from 'next/link';
import { useWritingStore } from '@/lib/store';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setAuthModalMode, currentUser } = useWritingStore();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span>Adaptive IELTS Writing Socratic Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Elevate Your Essay to <br />
              <span className="bg-gradient-to-r from-amber-400 via-indigo-300 to-brand-400 bg-clip-text text-transparent">
                Band 8.0 & Above
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Unlike traditional essay checkers that give direct copy-paste sentences, our adaptive platform acts as a real-time Socratic mentor during drafting and an official senior IELTS examiner upon submission.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/workspace"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/30 transition-all hover:scale-105"
              >
                <span>Launch Practice Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {!currentUser && (
                <button
                  onClick={() => setAuthModalMode('REGISTER')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-gray-200 hover:text-white hover:border-gray-500 font-semibold text-sm transition-all"
                >
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Create Free Account</span>
                </button>
              )}
            </div>

            {/* Micro Stats */}
            <div className="pt-6 border-t border-gray-800/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-center">
              <div>
                <div className="text-2xl font-black text-amber-400">Band 5.0–9.0</div>
                <div className="text-[11px] text-gray-400">Adaptive Rubrics</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">Dual-Layer</div>
                <div className="text-[11px] text-gray-400">Assessment System</div>
              </div>
              <div>
                <div className="text-2xl font-black text-indigo-400">0% Rewrites</div>
                <div className="text-[11px] text-gray-400">Pure Skill Building</div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Socratic Mock Preview Surface */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-6 border border-gray-700/80 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-gray-400 ml-2">live_socratic_engine.ts</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Target Band 7.5
                </span>
              </div>

              {/* Sample Essay Draft Snippet */}
              <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Student Active Draft</div>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">
                  &quot;Furthermore, governments should play an important role in controlling carbon emissions from major factories...&quot;
                </p>
              </div>

              {/* Live Socratic Guidance Card Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/40 space-y-2 shadow-lg animate-pulse-subtle">
                <div className="flex items-center justify-between text-xs font-bold text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                    Lexical Resource Elevation
                  </span>
                  <span className="text-[10px] text-gray-400">Paragraph 2</span>
                </div>
                <p className="text-xs text-brand-200 leading-relaxed">
                  &quot;You used the basic phrase &apos;important role&apos;. To achieve Band 7.5 Lexical Resource, what precise academic collocation (e.g. &apos;pivotal responsibility&apos; or &apos;imperative intervention&apos;) could elevate this point?&quot;
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
