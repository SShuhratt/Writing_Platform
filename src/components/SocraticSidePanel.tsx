'use client';

import React from 'react';
import { useWritingStore } from '@/lib/store';
import { SocraticGuidanceCard, GuidanceCategory } from '@/types/ielts';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Check, 
  Lightbulb, 
  MessageSquare,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export const SocraticSidePanel: React.FC = () => {
  const { guidanceCards, clearGuidanceCard, targetBand, assistanceMode, isAnalyzing } = useWritingStore();

  if (assistanceMode === 'FOCUS_EXAM') {
    return (
      <aside className="w-full lg:w-80 glass-panel rounded-2xl p-5 border border-gray-800 flex flex-col justify-center items-center text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-sm text-white">Focus Exam Mode Active</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Real-time Socratic guidance is muted to simulate standard IELTS test conditions. Your writing will be comprehensively evaluated upon clicking &quot;Submit Task&quot;.
        </p>
      </aside>
    );
  }

  const categoryBadge = (cat: GuidanceCategory) => {
    switch (cat) {
      case 'LEXICAL_RESOURCE':
        return <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Lexical Resource</span>;
      case 'COHERENCE_COHESION':
        return <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Coherence & Cohesion</span>;
      case 'TASK_RESPONSE':
        return <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Task Response</span>;
    }
  };

  return (
    <aside className="w-full lg:w-88 glass-panel rounded-2xl p-5 border border-gray-800 flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Socratic Guidance</h3>
            <p className="text-[11px] text-gray-400">Tuned to Band {targetBand}</p>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-400">
          Non-Directive
        </span>
      </div>

      {/* Guardrail Disclaimer Notice */}
      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
        <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          Our Socratic mentor highlights structural and lexical opportunities without providing copy-paste sentences, ensuring genuine skill development.
        </p>
      </div>

      {/* Guidance Cards Feed */}
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {guidanceCards.length === 0 ? (
          <div className="text-center py-10 px-4 text-gray-500 space-y-2">
            <Lightbulb className="h-8 w-8 mx-auto text-gray-600 animate-pulse-subtle" />
            <p className="text-xs">
              {isAnalyzing 
                ? `Evaluating text against Band ${targetBand} criteria...` 
                : `Type at least 50 words or complete a paragraph to trigger live Socratic mentorship cards.`}
            </p>
          </div>
        ) : (
          guidanceCards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl glass-card space-y-2.5 transition-all border-l-4 border-l-brand-500 relative group"
            >
              <div className="flex items-center justify-between">
                {categoryBadge(card.category)}
                <button
                  onClick={() => clearGuidanceCard(card.id)}
                  className="text-gray-500 hover:text-gray-300 text-xs p-1 rounded hover:bg-gray-800"
                  title="Dismiss card"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>

              <h4 className="font-bold text-xs text-white leading-snug">
                {card.title}
              </h4>

              {card.highlightSnippet && (
                <div className="text-[11px] p-2 rounded bg-gray-900/90 text-gray-400 border border-gray-800 italic">
                  &quot;{card.highlightSnippet}&quot;
                </div>
              )}

              <p className="text-xs text-brand-200 leading-relaxed bg-brand-950/30 p-2.5 rounded-lg border border-brand-500/20">
                {card.socraticPrompt}
              </p>

              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                <span>Paragraph {card.paragraphIndex}</span>
                <span>Criteria: Band {card.targetBandContext}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </aside>
  );
};
