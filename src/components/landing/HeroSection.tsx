'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useWritingStore } from '@/lib/store';
import { ArrowRight, Zap } from 'lucide-react';
import { SocraticBusinessFlow } from '@/components/landing/SocraticBusinessFlow';

const HERO_EASE = [0.22, 1, 0.36, 1] as const;

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
          <motion.div
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: HERO_EASE }}
            className="lg:col-span-6 xl:col-span-6 space-y-6 text-center lg:text-left"
          >
            {/* Top Badge with Official Logo */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs font-semibold backdrop-blur-sm">
              <div className="relative h-5 w-5 rounded-md overflow-hidden flex-shrink-0 border border-brand-500/40">
                <Image
                  src="/brand-logo.png"
                  alt="IELTS Mentor AI Logo"
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span>Official-Grade Adaptive AI Mentor</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Elevate Your Essay to <br />
              <span className="bg-gradient-to-r from-amber-500 via-indigo-600 to-brand-600 dark:from-amber-400 dark:via-indigo-300 dark:to-brand-400 bg-clip-text text-transparent">
                Band 8.0 & Above
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Unlike essay tools that hand you copy-paste sentences, our platform guides your thinking with live Socratic questions while you draft—then delivers an official Dual-Layer Examiner Report on submit.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              {currentUser ? (
                <Link
                  href="/workspace"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02]"
                >
                  <span>Launch Practice Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModalMode('LOGIN')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02]"
                >
                  <span>Launch Practice Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {!currentUser && (
                <button
                  onClick={() => setAuthModalMode('REGISTER')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-slate-800 dark:text-gray-200 hover:text-brand-600 dark:hover:text-white hover:border-brand-500 font-semibold text-sm transition-all"
                >
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Create Free Account</span>
                </button>
              )}
            </div>

            {/* Micro Stats */}
            <div className="pt-6 border-t border-slate-200 dark:border-gray-800/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">Band 5.0–9.0</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Adaptive Rubrics</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">Dual-Layer</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Assessment System</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">0% Rewrites</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Pure Skill Building</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Business Logic Motion Storyboard */}
          <motion.div
            initial={{ opacity: 0.94 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: HERO_EASE }}
            className="lg:col-span-6 xl:col-span-6"
          >
            <SocraticBusinessFlow />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
