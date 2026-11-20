'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import { BillingCurrency, BillingOrder, BillingPlanSpec, BillingStatusSummary, PlanCode } from '@/types/billing';
import {
  X,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Ticket,
  Clock,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Standalone upgrade, voucher redemption, and P2P transfer checkout modal.
 */
export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    activePlanCode,
    dailyEvaluationLimit,
    planExpiresAt,
    applyBillingSnapshot,
    setAuthModalMode,
  } = useWritingStore();

  const [activeTab, setActiveTab] = useState<'UPGRADE' | 'VOUCHER'>('UPGRADE');
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>('PRO_MONTHLY');
  const [statusData, setStatusData] = useState<BillingStatusSummary | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // P2P order state
  const [selectedCurrency, setSelectedCurrency] = useState<BillingCurrency>('UZS');
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  // Voucher redemption state
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadBillingStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const token = AuthService.getSessionToken();
      const res = await fetch('/api/billing/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusData(data);
        if (data.quota) {
          applyBillingSnapshot({
            planCode: data.quota.planCode,
            limit: data.quota.limit,
            used: data.quota.used,
            expiresAt: data.activeEntitlement?.expiresAt ?? null,
          });
        }
      }
    } catch (err) {
      console.warn('Could not load billing status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [applyBillingSnapshot]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      loadBillingStatus();
    }
  }, [isOpen, loadBillingStatus]);

  const hasPendingOrder = Boolean(statusData?.recentOrders?.some((ord) => ord.status === 'pending'));

  // Poll billing status every 15s while a payment confirmation is pending admin review
  useEffect(() => {
    if (!isOpen || !hasPendingOrder) return;
    const interval = setInterval(() => {
      loadBillingStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, hasPendingOrder, loadBillingStatus]);

  if (!isOpen) return null;

  const paidPlans: BillingPlanSpec[] = (statusData?.plans || []).filter(
    (p) => p.code === 'PRO_MONTHLY' || p.code === 'PRO_QUARTERLY'
  );
  const chosenPlan = paidPlans.find((p) => p.code === selectedPlan) || paidPlans[0];
  const recentOrders: BillingOrder[] = statusData?.recentOrders || [];
  const p2pConfigured = Boolean(statusData?.p2pPaymentInfo?.configured && statusData?.p2pPaymentInfo?.cardNumber);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setErrorMsg('Receipt image must be smaller than 1.5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptUrl(reader.result);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCard = async () => {
    if (!statusData?.p2pPaymentInfo?.cardNumber) return;
    try {
      await navigator.clipboard.writeText(statusData.p2pPaymentInfo.cardNumber);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 1800);
    } catch {
      // Clipboard fallback unavailable
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      setAuthModalMode('LOGIN');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmittingOrder(true);

    try {
      const token = AuthService.getSessionToken();
      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          planCode: selectedPlan,
          currency: selectedCurrency,
          paymentMethod: 'card_p2p',
          receiptNote: receiptNote.trim(),
          receiptUrl: receiptUrl || undefined,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not submit order. Make sure you are signed in.');
        return;
      }

      setReceiptNote('');
      setReceiptUrl('');
      setSuccessMsg(
        `Order ${data.order.id} submitted! Once confirmed by an administrator, 20 daily evaluations unlock automatically.`
      );
      await loadBillingStatus();
    } catch {
      setErrorMsg('Network error submitting purchase order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      setAuthModalMode('LOGIN');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsRedeeming(true);

    try {
      const token = AuthService.getSessionToken();
      const res = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Voucher code could not be redeemed.');
        return;
      }

      if (data.quota) {
        applyBillingSnapshot({
          planCode: data.quota.planCode,
          limit: data.quota.limit,
          used: data.quota.used,
          expiresAt: data.activeEntitlement?.expiresAt ?? null,
        });
      }

      setVoucherCode('');
      setSuccessMsg(
        `Voucher redeemed! Your account now includes ${data.quota?.limit || 20} evaluations per UTC day.`
      );
      await loadBillingStatus();
    } catch {
      setErrorMsg('Network error while redeeming voucher.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-gray-800 shadow-2xl relative text-slate-900 dark:text-white space-y-5">
        <button
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>IELTS Mentor Pro Plans & Access Codes</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Unlock 20 Daily Examiner Evaluations
          </h2>
          <p className="text-xs text-slate-600 dark:text-gray-400">
            Active plan:{' '}
            <span className="font-bold text-slate-900 dark:text-white">{activePlanCode}</span> ({dailyEvaluationLimit}/day
            {planExpiresAt ? ` • Valid until ${new Date(planExpiresAt).toLocaleDateString()}` : ''})
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-800 dark:text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('UPGRADE');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'UPGRADE'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Upgrade to Pro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('VOUCHER');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'VOUCHER'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>Redeem Voucher Code</span>
          </button>
        </div>

        {isLoadingStatus && !statusData ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : activeTab === 'UPGRADE' ? (
          <div className="space-y-5">
            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paidPlans.map((plan) => {
                const isSelected = selectedPlan === plan.code;
                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => setSelectedPlan(plan.code)}
                    className={`text-left p-4 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {plan.badge}
                      </span>
                    )}
                    <div className="text-sm font-extrabold">{plan.name}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-300">
                        {plan.priceUzs.toLocaleString()} UZS
                      </span>
                      <span className="text-xs text-slate-500">/ \${plan.priceUsd} USD</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-gray-400">
                      {plan.durationDays} days • {plan.dailyLimit} evaluations/day
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Features Preview */}
            {chosenPlan && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Included in {chosenPlan.name}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-slate-600 dark:text-gray-300">
                  {chosenPlan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* P2P Card Transfer Form */}
            {!p2pConfigured ? (
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 space-y-2 text-xs text-amber-900 dark:text-amber-200">
                <div className="font-bold">Direct Card Transfer Is Not Configured Yet</div>
                <p>
                  Card checkout details have not been configured on this deployment. You can activate IELTS Pro immediately using a promo or school voucher code.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('VOUCHER')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Redeem Voucher Instead
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/70">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      Direct Card Transfer ({statusData?.p2pPaymentInfo?.bankName || 'Humo / Uzcard'})
                    </div>
                    <div className="text-slate-500 dark:text-gray-400">
                      Holder: {statusData?.p2pPaymentInfo?.cardHolder || 'IELTS Mentor Official'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCard}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 font-mono text-xs flex items-center gap-1.5"
                  >
                    <span>{statusData?.p2pPaymentInfo?.cardNumber}</span>
                    {copiedCard ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Currency Selector */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700 dark:text-gray-300">Payment Currency</span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-gray-700 p-0.5 bg-slate-50 dark:bg-gray-950/60">
                    {(['UZS', 'USD'] as BillingCurrency[]).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSelectedCurrency(curr)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                          selectedCurrency === curr
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {hasPendingOrder && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200">
                    You already have a pending payment order under review. Status refreshes automatically every 15 seconds.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                    Transfer Reference / Sender Card Last 4 Digits
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder={
                      selectedCurrency === 'UZS' && chosenPlan
                        ? `e.g. Paid ${chosenPlan.priceUzs.toLocaleString()} UZS from •••• 4821`
                        : `e.g. Paid $${chosenPlan?.priceUsd ?? 5} USD from •••• 4821`
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                    Receipt Screenshot (Optional, max 1.5 MB)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleReceiptFileChange}
                      className="text-[11px] text-slate-600 dark:text-gray-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-200 dark:file:bg-gray-800 file:text-xs file:font-semibold"
                    />
                    {receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setReceiptUrl('')}
                        className="text-[11px] text-rose-500 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || hasPendingOrder}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Order...</span>
                    </>
                  ) : hasPendingOrder ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Payment Verification Pending...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        Submit Payment Confirmation (
                        {chosenPlan
                          ? selectedCurrency === 'USD'
                            ? `$${chosenPlan.priceUsd} USD`
                            : `${chosenPlan.priceUzs.toLocaleString()} UZS`
                          : 'Pro'}
                        )
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}

            {recentOrders.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Your Recent Orders</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {recentOrders.slice(0, 4).map((ord) => (
                    <div
                      key={ord.id}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold">{ord.planCode}</span>
                        <span className="text-slate-500 ml-2">
                          {ord.currency === 'USD'
                            ? `$${ord.amountPaid ?? ord.amountUsd} USD`
                            : `${(ord.amountPaid ?? ord.amountUzs).toLocaleString()} UZS`}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : ord.status === 'rejected' || ord.status === 'refunded'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleRedeemVoucher} className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold">Redeem Promo or School Seat Voucher</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Enter an access code from IELTS Mentor or your partner language academy to unlock 20 daily evaluations immediately.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Voucher Code
              </label>
              <input
                type="text"
                required
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="PRO-XXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isRedeeming || !voucherCode.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  <span>Activate Code Now</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

