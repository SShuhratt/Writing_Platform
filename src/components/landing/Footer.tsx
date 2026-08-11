'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800/80 bg-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">IELTS Mentor AI</div>
            <div className="text-[11px] text-gray-400">Adaptive Real-Time Socratic Platform</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link href="/workspace" className="hover:text-white transition-colors">
            Practice Workspace
          </Link>
        </div>

        <div className="text-xs text-gray-500">
          © {new Date().getFullYear()} IELTS Writing Assistant Platform. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
