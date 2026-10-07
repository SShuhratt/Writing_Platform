'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWritingStore } from '@/lib/store';

export const Footer: React.FC = () => {
  const { currentUser, setAuthModalMode } = useWritingStore();
  const router = useRouter();

  const handleWorkspaceClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      setAuthModalMode('LOGIN');
    } else {
      router.push('/workspace');
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-gray-800/80 bg-slate-100 dark:bg-gray-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-md border border-brand-500/20">
            <Image
              src="/brand-logo.png"
              alt="IELTS Mentor AI Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">IELTS Mentor AI</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Adaptive Real-Time Socratic Platform</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-gray-400">
          <button 
            onClick={handleWorkspaceClick}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Practice Workspace
          </button>
          <Link
            href="/privacy"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
        </div>

        <div className="text-xs text-slate-500 dark:text-gray-500">
          © {new Date().getFullYear()} IELTS Writing Assistant Platform. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
