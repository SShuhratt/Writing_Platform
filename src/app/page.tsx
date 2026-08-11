'use client';

import React, { useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { AuthService } from '@/lib/auth-service';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { BandShowcase } from '@/components/landing/BandShowcase';
import { WorkflowPillars } from '@/components/landing/WorkflowPillars';
import { Footer } from '@/components/landing/Footer';
import { AuthModals } from '@/components/auth/AuthModals';

export default function LandingPage() {
  const { setCurrentUser } = useWritingStore();

  useEffect(() => {
    const user = AuthService.getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, [setCurrentUser]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <main className="flex-1">
        <HeroSection />
        <BandShowcase />
        <WorkflowPillars />
      </main>

      <Footer />
      <AuthModals />
    </div>
  );
}
