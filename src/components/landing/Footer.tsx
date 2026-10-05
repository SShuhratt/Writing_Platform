'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
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
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5" />
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
        </div>

        <div className="text-xs text-slate-500 dark:text-gray-500">
          © {new Date().getFullYear()} IELTS Writing Assistant Platform. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
