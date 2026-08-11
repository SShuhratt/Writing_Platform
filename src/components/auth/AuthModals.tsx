'use client';

import React, { useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { AuthService, DEFAULT_ADMIN_PASS, DEFAULT_TEST_PASS } from '@/lib/auth-service';
import { TargetBand } from '@/types/ielts';
import { ALL_TARGET_BANDS } from '@/lib/ielts-rubric';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  User,
  Zap
} from 'lucide-react';

export const AuthModals: React.FC = () => {
  const { authModalMode, setAuthModalMode, setCurrentUser } = useWritingStore();

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [registerTargetBand, setRegisterTargetBand] = useState<TargetBand>('7.0');

  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [error, setError] = useState('');

  if (!authModalMode) return null;

  const handleClose = () => {
    setError('');
    setResetMsg('');
    setAuthModalMode(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = AuthService.login(loginIdentifier, loginPass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      handleClose();
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = AuthService.register(registerName, registerEmail, registerPass, registerTargetBand);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      handleClose();
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }
    const res = AuthService.resetPassword(resetEmail);
    setResetMsg(res.message);
  };

  const handleFillAdminCredentials = () => {
    setLoginIdentifier('shuhrat3');
    setLoginPass(DEFAULT_ADMIN_PASS);
    setError('');
  };

  const handleFillTestUserCredentials = () => {
    setLoginIdentifier('testuser@gmail.com');
    setLoginPass(DEFAULT_TEST_PASS);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-gray-700/80 shadow-2xl relative">
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800 mb-6">
          <button
            onClick={() => { setAuthModalMode('LOGIN'); setError(''); setResetMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authModalMode === 'LOGIN' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setAuthModalMode('REGISTER'); setError(''); setResetMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authModalMode === 'REGISTER' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email or Username</label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="testuser@gmail.com or shuhrat3"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('RESET_PASSWORD'); setError(''); }}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>

            {/* Quick Credentials Helpers */}
            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] text-emerald-200">Default Student: <strong>testuser@gmail.com</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleFillTestUserCredentials}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold"
                >
                  Auto-fill Student
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  <span className="text-[11px] text-indigo-200">Default Admin: <strong>shuhrat3</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleFillAdminCredentials}
                  className="px-2 py-0.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold"
                >
                  Auto-fill Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {authModalMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={registerPass}
                onChange={(e) => setRegisterPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Initial Target IELTS Score</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_TARGET_BANDS.slice(2).map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setRegisterTargetBand(band)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      registerTargetBand === band
                        ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Account & Start Practice</span>
              <Zap className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {authModalMode === 'RESET_PASSWORD' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Reset Your Password</h4>
                <p className="text-xs text-gray-400">Enter your email to receive recovery instructions</p>
              </div>
            </div>

            {resetMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Recovery Email Sent!</span>
                </div>
                <p>{resetMsg}</p>
                <button
                  onClick={() => { setAuthModalMode('LOGIN'); setResetMsg(''); }}
                  className="mt-2 w-full py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all"
                >
                  Send Recovery Link
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
