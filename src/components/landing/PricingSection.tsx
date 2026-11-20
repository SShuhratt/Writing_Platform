'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, GraduationCap, ArrowRight, Zap } from 'lucide-react';
import { PUBLIC_PRICING_PLANS } from '@/lib/pricing-config';
import { useWritingStore } from '@/lib/store';

export const PricingSection: React.FC = () => {
  const router = useRouter();
  const { currentUser, setAuthModalMode, setUpgradeModalOpen } = useWritingStore();

  const handlePlanSelect = (planCode: string) => {
    if (planCode === 'SCHOOL_SEAT') {
      router.push('/teacher');
      return;
    }

    if (!currentUser) {
      setAuthModalMode(planCode === 'FREE' ? 'REGISTER' : 'LOGIN');
      return;
    }

    if (planCode === 'FREE') {
      router.push('/workspace');
      return;
    }

    router.push('/workspace');
    setUpgradeModalOpen(true);
  };

  return (
    <section
      id="pricing"
      className="py-20 bg-slate-50/70 dark:bg-gray-950/60 border-t border-slate-200/80 dark:border-gray-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent Standalone Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Start Free. Upgrade When You Prep Intensively.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
            Practice daily with strict IELTS rubric calibration, or unlock 20 daily examiner evaluations, sentence diagnostics, and cohort seats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PUBLIC_PRICING_PLANS.map((plan, index) => {
            const isPopular = plan.code === 'PRO_MONTHLY';
            const isSchool = plan.code === 'SCHOOL_SEAT';

            return (
              <motion.div
                key={plan.code}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`rounded-3xl p-6 flex flex-col justify-between border transition-colors ${
                  isPopular
                    ? 'bg-white dark:bg-gray-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                    : 'bg-white dark:bg-gray-900/90 border-slate-200 dark:border-gray-800 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.badge && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isSchool
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed min-h-[34px]">
                    {plan.tagline}
                  </p>

                  <div className="pt-1 pb-3 border-b border-slate-100 dark:border-gray-800">
                    {plan.priceUzs === 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">Free</span>
                        <span className="text-xs text-slate-500">forever • {plan.dailyLimit}/day</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">
                            {plan.priceUzs.toLocaleString()} UZS
                          </span>
                          <span className="text-xs text-slate-500">
                            {isSchool ? '/ seat' : `/ ${plan.durationDays}d`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                          or ${plan.priceUsd} USD • {plan.dailyLimit} evaluations/day
                        </div>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-gray-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isSchool ? (
                    <Link
                      href="/teacher"
                      className="w-full py-2.5 px-4 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Open Academy Portal</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlanSelect(plan.code)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isPopular
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white'
                      }`}
                    >
                      {plan.code === 'FREE' ? <Zap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>
                        {plan.code === 'FREE'
                          ? currentUser
                            ? 'Launch Practice Workspace'
                            : 'Start Free Practice'
                          : `Choose ${plan.name.replace('IELTS ', '')}`}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

