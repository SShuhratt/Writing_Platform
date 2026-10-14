'use client';

import dynamic from 'next/dynamic';
export type { DataPoint3D } from './Task1Chart3D';

export const DynamicHeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  ),
});

export const DynamicTask1Chart3D = dynamic(() => import('./Task1Chart3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-slate-900 rounded-2xl flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  ),
});

export const DynamicBandBadge3D = dynamic(() => import('./BandBadge3D'), {
  ssr: false,
  loading: () => (
    <div className="w-[180px] h-[180px] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
    </div>
  ),
});
