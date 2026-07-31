'use client';

import React, { useState, useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateSubmissionEvaluation } from '@/lib/ai-service';
import { Navbar } from '@/components/Navbar';
import { EditorSurface } from '@/components/EditorSurface';
import { SocraticSidePanel } from '@/components/SocraticSidePanel';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { PromptSelectorModal } from '@/components/PromptSelectorModal';
import { DualLayerReportModal } from '@/components/DualLayerReportModal';

export default function Home() {
  const {
    essayText,
    targetBand,
    assistanceMode,
    currentPrompt,
    geminiApiKey,
    setGeminiApiKey,
    isSubmitting,
    setIsSubmitting,
    activeReport,
    setActiveReport
  } = useWritingStore();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);

  // Load API Key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ielts_gemini_api_key');
      if (storedKey) {
        setGeminiApiKey(storedKey);
      }
    }
  }, [setGeminiApiKey]);

  // Handle Essay Submission & Dual-Layer Assessment
  const handleSubmitTask = async () => {
    if (!essayText.trim()) return;

    setIsSubmitting(true);
    try {
      const report = await generateSubmissionEvaluation({
        essayText,
        targetBand,
        prompt: currentPrompt,
        mode: assistanceMode,
        apiKey: geminiApiKey,
      });

      setActiveReport(report);
    } catch (err) {
      console.error('Submission evaluation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      {/* Top Navbar Header */}
      <Navbar
        onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Center 8 cols: Editor Surface Canvas */}
        <section className="lg:col-span-8 h-full">
          <EditorSurface onSubmitTask={handleSubmitTask} />
        </section>

        {/* Right 4 cols: Real-Time Socratic Guidance Panel */}
        <section className="lg:col-span-4 h-full">
          <SocraticSidePanel />
        </section>

      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      <PromptSelectorModal
        isOpen={isPromptsModalOpen}
        onClose={() => setIsPromptsModalOpen(false)}
      />

      <DualLayerReportModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />
    </div>
  );
}
