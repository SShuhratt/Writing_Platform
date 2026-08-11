'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWritingStore } from '@/lib/store';
import { AuthService, DEFAULT_ADMIN_PASS } from '@/lib/auth-service';
import { getAdminAnalyticsKPIs, getBandDistributionMetrics, getRecentStudentSessions } from '@/lib/admin-service';
import { Navbar } from '@/components/Navbar';
import { AuthModals } from '@/components/auth/AuthModals';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Award, 
  Cpu, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Lock, 
  Key, 
  BarChart3, 
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, setCurrentUser } = useWritingStore();

  // Admin Login state
  const [adminUsername, setAdminUsername] = useState('shuhrat3');
  const [adminPassword, setAdminPassword] = useState(DEFAULT_ADMIN_PASS);
  const [loginError, setLoginError] = useState('');

  // Load User from Session on Mount
  useEffect(() => {
    const user = AuthService.getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, [setCurrentUser]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = AuthService.login(adminUsername, adminPassword);
    if (res.success && res.user && res.user.role === 'admin') {
      setCurrentUser(res.user);
    } else {
      setLoginError('Invalid Admin credentials. Use shuhrat3 / $Huhrat333');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const kpis = getAdminAnalyticsKPIs();
  const bandDist = getBandDistributionMetrics();
  const recentSessions = getRecentStudentSessions();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Admin Platform Dashboard</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  Live Monitoring
                </span>
              </div>
              <p className="text-xs text-gray-400">Real-time oversight of student drafting, band score distributions, and AI usage</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                <Activity className="h-3.5 w-3.5" />
                System Status: Operational
              </span>
            </div>
          )}
        </div>

        {/* SECURITY GUARD: If Not Admin, Show Admin Login Portal */}
        {!isAdmin ? (
          <div className="max-w-md mx-auto py-12">
            <div className="glass-panel rounded-3xl p-8 border border-gray-700/80 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Admin Authentication Required</h2>
                <p className="text-xs text-gray-400">
                  Please enter platform admin credentials to access the monitoring suite.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 text-center font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="shuhrat3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Admin Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="$Huhrat333"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
                  <span>Default Admin: <strong>shuhrat3</strong></span>
                  <button
                    type="button"
                    onClick={() => { setAdminUsername('shuhrat3'); setAdminPassword(DEFAULT_ADMIN_PASS); }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/40 text-indigo-200 font-bold text-[10px]"
                  >
                    Auto-fill
                  </button>
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
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Total Submissions</span>
                  <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{kpis.totalSubmissions.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-400 font-medium">↑ +14% from last week</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Active Sessions</span>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{kpis.activeSessions}</div>
                <div className="text-[11px] text-gray-400">Live drafting on workspace</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Avg Band Achieved</span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-400">Band {kpis.averageBandAchieved}</div>
                <div className="text-[11px] text-gray-400">Layer 1 Examiner score avg</div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">AI Tokens Processed</span>
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{(kpis.aiApiTokenCount / 1000).toFixed(1)}k</div>
                <div className="text-[11px] text-indigo-300 font-medium">Gemini 1.5 Socratic Engine</div>
              </div>

            </div>

            {/* Middle Grid: Band Distribution & Live Student Session Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 5 cols: Band Distribution Meters */}
              <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    Target Band Distribution
                  </h3>
                  <span className="text-xs text-gray-400">Bands 5.0 – 9.0</span>
                </div>

                <div className="space-y-3 pt-2">
                  {bandDist.map((item) => (
                    <div key={item.band} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-200">Band {item.band}</span>
                        <span className="text-gray-400">{item.count} students ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
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
              <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    Live Student Practice Activity Feed
                  </h3>
                  <span className="text-xs text-gray-400">Real-time log</span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{session.studentName}</span>
                          <span className="px-2 py-0.5 rounded font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                            Target {session.targetBand}
                          </span>
                        </div>
                        <div className="text-gray-300 font-medium">{session.taskTitle}</div>
                        <div className="text-gray-500 text-[11px]">{session.wordCount} words written</div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        {session.status === 'SUBMITTED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Band {session.scoreAchieved?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs animate-pulse">
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

      </main>

      <AuthModals />
    </div>
  );
}
