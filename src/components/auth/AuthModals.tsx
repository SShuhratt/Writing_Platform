'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
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
  Zap
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModals: React.FC = () => {
  const { authModalMode, setAuthModalMode, setCurrentUser } = useWritingStore();

  // Form states (Empty - no prefill)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [registerTargetBand, setRegisterTargetBand] = useState<TargetBand>('7.0');

  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1064108249362-jafv9f37fdqtg81kh7vjf46ppvbmdido.apps.googleusercontent.com';

  // Initialize Google Identity Services button
  useEffect(() => {
    if (!authModalMode || (authModalMode !== 'LOGIN' && authModalMode !== 'REGISTER')) return;

    const initGoogle = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: any) => {
              if (!response?.credential) return;
              try {
                // Decode base64 JWT payload
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const data = JSON.parse(jsonPayload);
                const res = AuthService.loginWithGoogle({
                  email: data.email,
                  name: data.name,
                  sub: data.sub,
                });
                if (res.success && res.user) {
                  setCurrentUser(res.user);
                  handleClose();
                }
              } catch (parseErr) {
                console.error('Failed to parse Google credential token:', parseErr);
                setError('Google authentication succeeded, but profile parsing failed.');
              }
            },
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: authModalMode === 'REGISTER' ? 'signup_with' : 'signin_with',
              shape: 'pill',
            });
          }
        } catch (e) {
          console.warn('Could not initialize Google Identity Services:', e);
        }
      }
    };

    // Attempt immediately and with retry if script is still loading
    initGoogle();
    const timer = setTimeout(initGoogle, 600);
    return () => clearTimeout(timer);
  }, [authModalMode, googleClientId]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700/80 shadow-2xl relative text-slate-900 dark:text-white">
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-900/90 p-1 rounded-xl border border-slate-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => { setAuthModalMode('LOGIN'); setError(''); setResetMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authModalMode === 'LOGIN' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setAuthModalMode('REGISTER'); setError(''); setResetMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authModalMode === 'REGISTER' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Section */}
        {(authModalMode === 'LOGIN' || authModalMode === 'REGISTER') && (
          <div className="mb-4">
            <div className="flex justify-center min-h-[44px] items-center">
              <div ref={googleBtnRef} className="w-full flex justify-center" />
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                <span className="bg-white dark:bg-gray-900 px-3 text-slate-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Email or Username</label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter email or username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('RESET_PASSWORD'); setError(''); }}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
              />
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={registerPass}
                onChange={(e) => setRegisterPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Initial Target IELTS Score</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_TARGET_BANDS.slice(2).map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setRegisterTargetBand(band)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      registerTargetBand === band
                        ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md'
                        : 'bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-400 border-slate-200 dark:border-gray-800 hover:text-slate-900 dark:hover:text-white'
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
              <div className="h-10 w-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Reset Your Password</h4>
                <p className="text-xs text-slate-600 dark:text-gray-400">Enter your email to receive recovery instructions</p>
              </div>
            </div>

            {resetMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-gray-600"
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

        {/* Terms and Privacy Policy Links */}
        <div className="pt-3 mt-1 border-t border-slate-100 dark:border-gray-800 text-[11px] text-center text-slate-500 dark:text-gray-400">
          By continuing, you agree to our{' '}
          <Link href="/terms" onClick={handleClose} className="underline hover:text-slate-900 dark:hover:text-white font-medium">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" onClick={handleClose} className="underline hover:text-slate-900 dark:hover:text-white font-medium">Privacy Policy</Link>.
        </div>

      </div>
    </div>
  );
};
