'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import {
  getEmptyAdminAnalytics,
  fetchAdminDashboardData,
} from '@/lib/admin-service';
import { Navbar } from '@/components/Navbar';
import { AuthModals } from '@/components/auth/AuthModals';
import { AdminBillingOverview, PlanCode } from '@/types/billing';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Award, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Lock, 
  BarChart3, 
  RefreshCw,
  Activity,
  CreditCard,
  Ticket,
  Copy,
  Check,
  XCircle,
  Plus,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, setCurrentUser } = useWritingStore();

  // Admin Login state (Empty by default - no prefill)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);

  // Cryptographically verify Admin Session with the server on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const user = AuthService.getStoredUser();
      if (user && user.role === 'admin') {
        const isValid = await AuthService.verifyAdminSession();
        if (isMounted) {
          if (isValid) {
            setCurrentUser(user);
            setIsVerifiedAdmin(true);
          } else {
            setCurrentUser(null);
            setIsVerifiedAdmin(false);
          }
        }
      } else {
        if (isMounted) {
          setIsVerifiedAdmin(false);
        }
      }
      if (isMounted) {
        setIsVerifyingAuth(false);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [setCurrentUser]);

  const emptyAnalytics = getEmptyAdminAnalytics();
  const [kpis, setKpis] = useState(emptyAnalytics.kpis);
  const [bandDist, setBandDist] = useState(emptyAnalytics.bandDistribution);
  const [recentSessions, setRecentSessions] = useState(emptyAnalytics.recentSessions);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Stage 1 Billing & Voucher management state
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'BILLING'>('ANALYTICS');
  const [billingOverview, setBillingOverview] = useState<AdminBillingOverview | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'pending' | 'paid' | 'rejected' | 'refunded'>('ALL');
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingNotice, setBillingNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderActionId, setOrderActionId] = useState<string | null>(null);
  const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(null);

  // Voucher creation form
  const [newVoucherPlan, setNewVoucherPlan] = useState<Exclude<PlanCode, 'FREE'>>('PRO_MONTHLY');
  const [newVoucherMaxUses, setNewVoucherMaxUses] = useState<number>(1);
  const [newVoucherDays, setNewVoucherDays] = useState<number>(30);
  const [newVoucherCode, setNewVoucherCode] = useState<string>('');
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  const loadLiveAnalytics = async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    const data = await fetchAdminDashboardData();
    if (data) {
      setKpis(data.kpis);
      setBandDist(data.bandDistribution);
      setRecentSessions(data.recentSessions);
      if (data.error) {
        setAnalyticsError(data.error);
      }
    }
    setIsLoadingAnalytics(false);
  };

  const loadBillingOverview = async (pageOverride?: number, statusOverride?: string) => {
    const adminToken = AuthService.getAdminToken();
    if (!adminToken) return;
    const targetPage = pageOverride ?? ordersPage;
    const targetStatus = statusOverride ?? orderStatusFilter;
    setIsLoadingBilling(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: '15',
      });
      if (targetStatus !== 'ALL') {
        params.set('status', targetStatus);
      }
      const res = await fetch(`/api/admin/billing?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBillingOverview({
          totalRevenueUzs: data.totalRevenueUzs ?? 0,
          totalRevenueUsd: data.totalRevenueUsd ?? 0,
          pendingOrdersCount: data.pendingOrdersCount ?? 0,
          activeEntitlementsCount: data.activeEntitlementsCount ?? 0,
          totalOrdersCount: data.totalOrdersCount ?? (Array.isArray(data.orders) ? data.orders.length : 0),
          totalVouchersCount: data.totalVouchersCount ?? (Array.isArray(data.vouchers) ? data.vouchers.length : 0),
          orders: Array.isArray(data.orders) ? data.orders : [],
          vouchers: Array.isArray(data.vouchers) ? data.vouchers : [],
        });
      }
    } catch (err) {
      console.error('Failed to load billing overview:', err);
      setBillingNotice({ type: 'error', text: 'Failed to load billing overview.' });
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleReviewOrder = async (
    orderId: string,
    action: 'APPROVE' | 'REJECT' | 'REFUND_ORDER' | 'REVOKE_ORDER'
  ) => {
    const adminToken = AuthService.getAdminToken();
    if (!adminToken) return;
    setOrderActionId(orderId);
    setBillingNotice(null);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBillingNotice({ type: 'error', text: data.error || `Failed to update order (${action}).` });
        return;
      }
      const messages: Record<string, string> = {
        APPROVE: `Order ${orderId} approved and Pro entitlement activated.`,
        REJECT: `Order ${orderId} marked as rejected.`,
        REFUND_ORDER: `Order ${orderId} refunded and entitlement revoked.`,
        REVOKE_ORDER: `Entitlement for order ${orderId} revoked.`,
      };
      setBillingNotice({
        type: 'success',
        text: messages[action] || `Order ${orderId} updated.`,
      });
      await loadBillingOverview();
    } catch {
      setBillingNotice({ type: 'error', text: 'Network error while updating billing order.' });
    } finally {
      setOrderActionId(null);
    }
  };

  const handleToggleVoucher = async (code: string, currentActive: boolean) => {
    const adminToken = AuthService.getAdminToken();
    if (!adminToken) return;
    setBillingNotice(null);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'TOGGLE_VOUCHER',
          code,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBillingNotice({ type: 'error', text: data.error || 'Could not toggle voucher state.' });
        return;
      }
      setBillingNotice({
        type: 'success',
        text: `Voucher ${code} is now ${!currentActive ? 'active' : 'disabled'}.`,
      });
      await loadBillingOverview();
    } catch {
      setBillingNotice({ type: 'error', text: 'Network error updating voucher.' });
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminToken = AuthService.getAdminToken();
    if (!adminToken) return;
    setIsCreatingVoucher(true);
    setBillingNotice(null);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          planCode: newVoucherPlan,
          maxUses: newVoucherMaxUses,
          durationDays: newVoucherDays,
          code: newVoucherCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBillingNotice({ type: 'error', text: data.error || 'Could not create promo voucher.' });
        return;
      }
      setNewVoucherCode('');
      setBillingNotice({
        type: 'success',
        text: `Voucher ${data.voucher.code} created (${data.voucher.planCode}, ${data.voucher.maxUses} uses).`,
      });
      await loadBillingOverview();
    } catch {
      setBillingNotice({ type: 'error', text: 'Network error while creating promo voucher.' });
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const handleCopyVoucher = async (code: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedVoucherCode(code);
      setTimeout(() => setCopiedVoucherCode(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  useEffect(() => {
    if (isVerifiedAdmin) {
      loadLiveAnalytics();
      loadBillingOverview();
    }
  }, [isVerifiedAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await AuthService.login(adminUsername, adminPassword);
    if (res.success && res.user && res.user.role === 'admin') {
      setCurrentUser(res.user);
      setIsVerifiedAdmin(true);
    } else {
      setLoginError(res.error || 'Invalid Admin credentials.');
    }
  };

  const isAdmin = isVerifiedAdmin && currentUser?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Platform Dashboard</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  Live Monitoring
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Real-time oversight of student drafting, band score distributions, and AI usage</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  loadLiveAnalytics();
                  loadBillingOverview();
                }}
                disabled={isLoadingAnalytics || isLoadingBilling}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
                title="Refresh Analytics and Billing from Database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalytics || isLoadingBilling ? 'animate-spin text-indigo-500' : ''}`} />
                <span>{isLoadingAnalytics || isLoadingBilling ? 'Updating...' : 'Sync Live Data'}</span>
              </button>

              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5 font-bold">
                <Activity className="h-3.5 w-3.5" />
                System Status: Operational
              </span>
            </div>
          )}
        </div>

        {/* SECURITY GUARD: If Verifying, show subtle loader */}
        {isVerifyingAuth ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : !isAdmin ? (
          <div className="max-w-md mx-auto py-12">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-slate-200 dark:border-gray-700/80 shadow-2xl space-y-6 text-slate-900 dark:text-white">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Authentication Required</h2>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Please enter platform admin credentials to access the monitoring suite.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-800 dark:text-rose-300 text-center font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Admin Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all"
                >
                  Authenticate as Admin
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ADMIN DASHBOARD SUITE */
          <div className="space-y-8">
            {/* Section Switcher */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('ANALYTICS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics & Monitoring
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BILLING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'BILLING'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Billing, Orders & Vouchers
                {billingOverview && billingOverview.pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                    {billingOverview.pendingOrdersCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'BILLING' ? (
              <div className="space-y-8">
                {billingNotice && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                      billingNotice.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <span>{billingNotice.text}</span>
                    <button
                      type="button"
                      onClick={() => setBillingNotice(null)}
                      className="text-[11px] opacity-75 hover:opacity-100 underline ml-4"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Billing KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Confirmed Revenue</span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {(billingOverview?.totalRevenueUzs ?? 0).toLocaleString()} UZS
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                      ≈ ${billingOverview?.totalRevenueUsd ?? 0} USD confirmed
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Pending P2P Orders</span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {billingOverview?.pendingOrdersCount ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400">Awaiting transfer check</div>
                  </div>

                  <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Active Pro Entitlements</span>
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Award className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {billingOverview?.activeEntitlementsCount ?? 0}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live 20/day tier users</div>
                  </div>

                  <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Promo Vouchers</span>
                      <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        <Ticket className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {billingOverview?.totalVouchersCount ?? billingOverview?.vouchers.length ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400">Active & historical codes</div>
                  </div>
                </div>

                {/* Orders + Voucher Generator Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* P2P Orders Table */}
                  <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">P2P & Billing Orders</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          Verify student receipts, approve Pro access, or manage refunds ({billingOverview?.totalOrdersCount ?? 0} total).
                        </p>
                      </div>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => {
                          const next = e.target.value as 'ALL' | 'pending' | 'paid' | 'rejected' | 'refunded';
                          setOrderStatusFilter(next);
                          setOrdersPage(1);
                          loadBillingOverview(1, next);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs font-semibold text-slate-800 dark:text-gray-200"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    {!billingOverview || billingOverview.orders.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-dashed border-slate-200 dark:border-gray-800 text-xs text-slate-500 dark:text-gray-400">
                        No billing orders match this filter.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                        {billingOverview.orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {order.userEmail}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                                  {order.planCode}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    order.status === 'paid'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : order.status === 'pending'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                                {order.currency === 'USD'
                                  ? `$${order.amountPaid ?? order.amountUsd} USD`
                                  : `${(order.amountPaid ?? order.amountUzs).toLocaleString()} UZS`}{' '}
                                · {order.paymentMethod}
                                {order.receiptNote ? ` · Receipt: "${order.receiptNote}"` : ''}
                              </p>
                              {order.receiptUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewReceiptUrl(order.receiptUrl || null)}
                                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  View Uploaded Receipt Image
                                </button>
                              )}
                            </div>

                            {order.status === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={orderActionId === order.id}
                                  onClick={() => handleReviewOrder(order.id, 'APPROVE')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={orderActionId === order.id}
                                  onClick={() => handleReviewOrder(order.id, 'REJECT')}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 disabled:opacity-50 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            )}

                            {order.status === 'paid' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={orderActionId === order.id}
                                  onClick={() => handleReviewOrder(order.id, 'REFUND_ORDER')}
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-colors"
                                >
                                  Refund &amp; Revoke
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {billingOverview && billingOverview.totalOrdersCount > 15 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-800 text-xs">
                        <span className="text-slate-500">Page {ordersPage}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={ordersPage <= 1 || isLoadingBilling}
                            onClick={() => {
                              const prev = Math.max(1, ordersPage - 1);
                              setOrdersPage(prev);
                              loadBillingOverview(prev);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-700 disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={ordersPage * 15 >= billingOverview.totalOrdersCount || isLoadingBilling}
                            onClick={() => {
                              const next = ordersPage + 1;
                              setOrdersPage(next);
                              loadBillingOverview(next);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-700 disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voucher Generator + List */}
                  <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-5">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">Generate Promo / School Voucher</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        Issue multi-use seat codes for schools, Telegram payments, or trial promotions.
                      </p>
                    </div>

                    <form onSubmit={handleCreateVoucher} className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3 sm:col-span-1 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-gray-400">Plan</label>
                          <select
                            value={newVoucherPlan}
                            onChange={(e) => setNewVoucherPlan(e.target.value as Exclude<PlanCode, 'FREE'>)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                          >
                            <option value="PRO_MONTHLY">PRO_MONTHLY</option>
                            <option value="PRO_QUARTERLY">PRO_QUARTERLY</option>
                            <option value="SCHOOL_SEAT">SCHOOL_SEAT</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-gray-400">Max Uses</label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={newVoucherMaxUses}
                            onChange={(e) => setNewVoucherMaxUses(Number(e.target.value) || 1)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-gray-400">Days</label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={newVoucherDays}
                            onChange={(e) => setNewVoucherDays(Number(e.target.value) || 30)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newVoucherCode}
                          onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Custom code (optional, auto-generated)"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={isCreatingVoucher}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isCreatingVoucher ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 pt-2 border-t border-slate-200 dark:border-gray-800">
                      {!billingOverview || billingOverview.vouchers.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-gray-400 py-3 text-center">No promo vouchers created yet.</p>
                      ) : (
                        billingOverview.vouchers.map((voucher) => (
                          <div
                            key={voucher.code}
                            className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{voucher.code}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300">
                                  {voucher.planCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                                Used {voucher.usedCount}/{voucher.maxUses} · {voucher.durationDays}d · {voucher.dailyLimit}/day
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleVoucher(voucher.code, voucher.isActive)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                  voucher.isActive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-500'
                                    : 'bg-slate-200 dark:bg-gray-800 text-slate-500 border-slate-300 dark:border-gray-700 hover:text-emerald-500'
                                }`}
                                title={voucher.isActive ? 'Disable voucher' : 'Activate voucher'}
                              >
                                {voucher.isActive ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyVoucher(voucher.code)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300 transition-colors"
                                title="Copy voucher code"
                              >
                                {copiedVoucherCode === voucher.code ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-8">
            {analyticsError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-800 dark:text-rose-200 font-medium">
                {analyticsError}
              </div>
            )}
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Total Submissions</span>
                  <div className="p-2 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{kpis.totalSubmissions.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">Recorded evaluated essays</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Active Writers (24h)</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{kpis.activeSessions}</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">Distinct learners in last 24h</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Avg Band Achieved</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.totalSubmissions > 0 ? `Band ${kpis.averageBandAchieved}` : '—'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">Layer 1 Examiner score avg</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">AI Tokens Processed</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{(kpis.aiApiTokenCount / 1000).toFixed(1)}k</div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium">Real Gemini API token count</div>
              </div>

            </div>

            {/* Middle Grid: Band Distribution & Live Student Session Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 5 cols: Band Distribution Meters */}
              <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    Target Band Distribution
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-gray-400">Bands 5.0 – 9.0</span>
                </div>

                <div className="space-y-3 pt-2">
                  {bandDist.map((item) => (
                    <div key={item.band} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-gray-200">Band {item.band}</span>
                        <span className="text-slate-500 dark:text-gray-400">{item.count} students ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-gray-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-amber-400 rounded-full"
                          style={{ width: `${item.percentage * 3}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 7 cols: Live Student Practice Activity Feed */}
              <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    Live Student Practice Activity Feed
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-gray-400">Real-time log</span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{session.studentName}</span>
                          <span className="px-2 py-0.5 rounded font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px]">
                            Target {session.targetBand}
                          </span>
                        </div>
                        <div className="text-slate-700 dark:text-gray-300 font-medium">{session.taskTitle}</div>
                        <div className="text-slate-500 text-[11px]">{session.wordCount} words written</div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        {session.status === 'SUBMITTED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Band {session.scoreAchieved?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30 text-xs animate-pulse">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Drafting...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            </div>
            )}

          </div>
        )}

      </main>

      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-200 dark:border-gray-700 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Uploaded Student Payment Receipt</span>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-gray-800"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewReceiptUrl}
              alt="Payment receipt"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-200 dark:border-gray-800"
            />
          </div>
        </div>
      )}

      <AuthModals />
    </div>
  );
}
