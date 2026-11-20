'use client';

import React from 'react';
import {
  X,
  Zap,
  Clock,
  CheckCircle2,
  History,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onOpenUpgrade?: () => void;
  resetsInHours?: number;
  resetsAt?: string | null;
  dailyLimit?: number;
  planCode?: string;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
  onOpenUpgrade,
  resetsInHours = 8,
  resetsAt,
  dailyLimit = 2,
  planCode = 'FREE',
}) => {
  if (!isOpen) return null;

  const isFree = planCode === 'FREE';
  const resolvedResetDate = resetsAt
    ? new Date(resetsAt)
    : (() => {
        const d = new Date();
        d.setUTCHours(24, 0, 0, 0);
        return d;
      })();
  const localResetTime = Number.isNaN(resolvedResetDate.getTime())
    ? 'midnight UTC'
    : resolvedResetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-gray-800 shadow-2xl relative flex flex-col text-slate-900 dark:text-white space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Heading */}
        <div className="text-center space-y-2 pt-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Zap className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{isFree ? 'Daily Free Practice Limit Reached' : 'Daily Plan Limit Reached'}</span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {dailyLimit} of {dailyLimit} Daily Evaluations Used
          </h3>

          <p className="text-xs md:text-sm text-slate-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {isFree
              ? 'Free practice includes 2 examiner-grade AI evaluations per day. Upgrade to IELTS Pro or redeem a voucher code to unlock 20 evaluations daily.'
              : 'You have reached today’s 20-evaluation fair-use cap. Your counter resets automatically at midnight UTC.'}
          </p>
        </div>

        {/* Reset Countdown Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-gray-300">
            <Clock className="h-5 w-5 text-indigo-500 shrink-0" />
            <div>
              <div className="font-bold">Next Practice Reset</div>
              <div className="text-slate-500 text-[11px]">
                Resets at {localResetTime} local time (in ~{resetsInHours} hours)
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30 text-xs">
            ~{resetsInHours}h remaining
          </span>
        </div>

        {/* Pro Plan Value Props */}
        {isFree && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-brand-500/5 to-purple-500/5 border border-brand-500/20 text-xs">
            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span>Unlock IELTS Pro (20 Evaluations / Day)</span>
            </div>
            <div className="space-y-1.5 text-slate-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>20 Dual-Layer AI Examiner evaluations every UTC day</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Interactive grammar, collocation & coherence highlights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Instant activation via Voucher Code or P2P card transfer</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onOpenUpgrade && (
            <button
              onClick={() => {
                onClose();
                onOpenUpgrade();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isFree ? 'Upgrade to Pro / Redeem Code' : 'View Plan & Vouchers'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {onOpenHistory && (
            <button
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-800 dark:text-gray-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <History className="h-4 w-4 text-brand-500" />
              <span>Review Past Evaluations in History</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 text-xs font-semibold transition-colors"
          >
            Continue Drafting Offline
          </button>
        </div>
      </div>
    </div>
  );
};
