'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateRealtimeGuidance } from '@/lib/ai-service';
import { Task1VisualIllustration } from './Task1VisualIllustration';
import { 
  Clock, 
  FileText, 
  AlignLeft, 
  TrendingUp, 
  TrendingDown, 
  Send, 
  Loader2,
  Shield,
  ShieldAlert,
  BookOpen
} from 'lucide-react';

interface EditorSurfaceProps {
  onSubmitTask: () => void;
  onOpenPromptsModal?: () => void;
}

export const EditorSurface: React.FC<EditorSurfaceProps> = ({ onSubmitTask, onOpenPromptsModal }) => {
  const {
    essayText,
    updateEssayText,
    wordCount,
    paragraphCount,
    elapsedSeconds,
    isTimerRunning,
    setTimerRunning,
    incrementTimer,
    currentPrompt,
    targetBand,
    setTargetBand,
    assistanceMode,
    isAnalyzing,
    setIsAnalyzing,
    setGuidanceCards,
    levelOffer,
    setLevelOffer,
    isSubmitting
  } = useWritingStore();

  const [pasteBlockedWarning, setPasteBlockedWarning] = useState<string | null>(null);
  const pasteWarningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevParagraphCountRef = useRef<number>(0);
  const lastEvaluatedSentenceCountRef = useRef<number>(0);
  const lastEvaluated30WordBucketRef = useRef<number>(0);
  const lastEvaluatedTopicSentenceParaIndexRef = useRef<number>(0);
  const checkedConclusionRef = useRef<boolean>(false);

  // Reset Milestone Tracking Refs on Essay Reset
  useEffect(() => {
    if (essayText.length === 0) {
      prevParagraphCountRef.current = 0;
      lastEvaluatedSentenceCountRef.current = 0;
      lastEvaluated30WordBucketRef.current = 0;
      lastEvaluatedTopicSentenceParaIndexRef.current = 0;
      checkedConclusionRef.current = false;
    }
  }, [essayText]);

  // Timer Tick Hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, incrementTimer]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  // Trigger Asynchronous Realtime Analysis (Workflow 3.1 & 3.4)
  const triggerAnalysis = async (currentText: string, triggerReason?: string) => {
    if (assistanceMode === 'FOCUS_EXAM' || isAnalyzing) return; // Muted in Focus Exam Mode or if actively analyzing
    const currentWords = currentText.trim().split(/\s+/).filter(Boolean).length;
    if (currentWords < 10) return; // Baseline minimum

    setIsAnalyzing(true);
    try {
      const res = await generateRealtimeGuidance({
        essayText: currentText,
        targetBand,
        prompt: currentPrompt,
      });

      if (res.cards) {
        setGuidanceCards(res.cards);
      }
      if (res.levelOffer !== undefined) {
        setLevelOffer(res.levelOffer);
      }
    } catch (err) {
      console.error('Realtime analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper: Count complete sentences using punctuation [.!?]
  const countCompleteSentences = (text: string): number => {
    const matches = text.match(/[.!?](\s+|$)/g);
    return matches ? matches.length : 0;
  };

  // Check for Conclusion keywords
  const isConclusionTyped = (text: string): boolean => {
    const lower = text.toLowerCase();
    return lower.includes('in conclusion') || 
           lower.includes('to conclude') || 
           lower.includes('in summary') || 
           lower.includes('to summarize') || 
           lower.includes('overall, it is evident') ||
           lower.includes('overall, in conclusion');
  };

  const triggerPasteBlockedWarning = () => {
    setPasteBlockedWarning(
      'Pasting is disabled in the Practice Workspace. Direct typing is required to build genuine IELTS exam writing speed, muscle memory, and cognitive vocabulary recall.'
    );
    if (pasteWarningTimerRef.current) clearTimeout(pasteWarningTimerRef.current);
    pasteWarningTimerRef.current = setTimeout(() => {
      setPasteBlockedWarning(null);
    }, 4500);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    triggerPasteBlockedWarning();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    triggerPasteBlockedWarning();
  };

  // Continuous Multi-Condition Trigger Engine
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateEssayText(newText);

    if (!isTimerRunning && newText.length > 0) {
      setTimerRunning(true);
    }

    if (assistanceMode === 'FOCUS_EXAM') return;

    const currentWords = newText.trim().split(/\s+/).filter(Boolean).length;
    const currentSentences = countCompleteSentences(newText);
    const paragraphs = newText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const currentParagraphs = paragraphs.length;

    let shouldTriggerImmediately = false;
    let triggerReason = '';

    // Trigger Condition 1: EACH 30 Words Milestone (30, 60, 90, 120, 150, 180, 210, 240, 270, 300...)
    const current30Bucket = Math.floor(currentWords / 30);
    if (current30Bucket > lastEvaluated30WordBucketRef.current && current30Bucket > 0) {
      lastEvaluated30WordBucketRef.current = current30Bucket;
      shouldTriggerImmediately = true;
      triggerReason = `Milestone: ${current30Bucket * 30} Words Reached`;
    }

    // Trigger Condition 2: EACH 2 Complete Sentences Milestone (at 2, 4, 6, 8, 10 sentences...)
    if (currentSentences - lastEvaluatedSentenceCountRef.current >= 2) {
      lastEvaluatedSentenceCountRef.current = currentSentences;
      shouldTriggerImmediately = true;
      triggerReason = `Milestone: ${currentSentences} Sentences Completed`;
    }

    // Trigger Condition 3: EACH Paragraph Completion (pressing Enter twice)
    if (currentParagraphs > prevParagraphCountRef.current) {
      prevParagraphCountRef.current = currentParagraphs;
      shouldTriggerImmediately = true;
      triggerReason = `Paragraph ${currentParagraphs} Completed`;
    }

    // Trigger Condition 4: First Sentence of EACH Paragraph (Topic Sentence & Structure Check)
    if (currentParagraphs > 0) {
      const activeParagraph = paragraphs[paragraphs.length - 1] || '';
      const activeParaSentences = countCompleteSentences(activeParagraph);
      if (activeParaSentences >= 1 && lastEvaluatedTopicSentenceParaIndexRef.current !== currentParagraphs) {
        lastEvaluatedTopicSentenceParaIndexRef.current = currentParagraphs;
        shouldTriggerImmediately = true;
        triggerReason = `Paragraph ${currentParagraphs} Topic Sentence`;
      }
    }

    // Trigger Condition 5: EACH Conclusion Signal or Final Summary Paragraph
    if (isConclusionTyped(newText) && !checkedConclusionRef.current) {
      checkedConclusionRef.current = true;
      shouldTriggerImmediately = true;
      triggerReason = 'Conclusion Signal Detected';
    }

    if (shouldTriggerImmediately) {
      triggerAnalysis(newText, triggerReason);
    }

    // Normalize milestone refs if user deleted/backspaced text
    if (current30Bucket < lastEvaluated30WordBucketRef.current) {
      lastEvaluated30WordBucketRef.current = current30Bucket;
    }
    if (currentSentences < lastEvaluatedSentenceCountRef.current) {
      lastEvaluatedSentenceCountRef.current = currentSentences;
    }
    if (currentParagraphs < prevParagraphCountRef.current) {
      prevParagraphCountRef.current = currentParagraphs;
    }
    if (!isConclusionTyped(newText)) {
      checkedConclusionRef.current = false;
    }

    // Continuous Short Typing Pause Trigger (3 Seconds)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      if (currentWords >= 10) {
        triggerAnalysis(newText, 'Typing Pause');
      }
    }, 3000);
  };

  // Re-trigger analysis IMMEDIATELY when Target Band or Assistance Mode changes mid-task
  useEffect(() => {
    const currentWords = essayText.trim().split(/\s+/).filter(Boolean).length;
    if (currentWords >= 10 && assistanceMode === 'ACTIVE_ASSISTANT') {
      triggerAnalysis(essayText, 'Dynamic Band Target Change');
    }
  }, [targetBand, assistanceMode]);

  const targetWords = currentPrompt.minWordCount;
  const wordProgressPercent = Math.min(100, Math.round((wordCount / targetWords) * 100));

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* Non-Modal Level Offer Banner */}
      {levelOffer && assistanceMode === 'ACTIVE_ASSISTANT' && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 animate-fadeIn transition-all ${
          levelOffer.type === 'UPWARD'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-200'
            : 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/60 dark:border-amber-500/40 dark:text-amber-200'
        }`}>
          <div className="flex items-start gap-3">
            {levelOffer.type === 'UPWARD' ? (
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="font-bold text-sm">
                {levelOffer.type === 'UPWARD' ? 'Target Upgrade Recommendation' : 'Adaptive Band Recalibration'}
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                {levelOffer.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLevelOffer(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                setTargetBand(levelOffer.suggestedBand);
                setLevelOffer(null);
              }}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all ${
                levelOffer.type === 'UPWARD'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-gray-950'
              }`}
            >
              Adjust to Band {levelOffer.suggestedBand}
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Canvas Header - Selected Topic with Yellow Background and Black & Dark Blue Font */}
      <div className="rounded-2xl p-5 border-2 border-amber-500 bg-amber-400 dark:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/15 space-y-3.5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-950 text-amber-300 border border-blue-900 shadow-sm">
                {currentPrompt.category}
              </span>
              <span className="text-xs font-bold text-blue-950">
                • {currentPrompt.recommendedTimeMinutes} mins recommended
              </span>
              <span className="text-xs font-bold text-blue-950">
                • Min: {currentPrompt.minWordCount} words
              </span>
              {onOpenPromptsModal && (
                <button
                  type="button"
                  onClick={onOpenPromptsModal}
                  className="flex items-center gap-1 ml-auto sm:ml-2 text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 text-amber-300 border border-blue-900 shadow-sm transition-all"
                  title="Switch to another IELTS question"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Change Topic</span>
                </button>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-black text-slate-950 leading-snug">
              {currentPrompt.title}
            </h2>

            {currentPrompt.chartDescription && (
              <div className="p-3 rounded-xl bg-amber-300/90 border border-amber-600/50 text-blue-950 text-xs font-semibold italic leading-relaxed">
                {currentPrompt.chartDescription}
              </div>
            )}

            <p className="text-xs md:text-sm font-semibold text-slate-950 leading-relaxed">
              {currentPrompt.questionText}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Live Stats Indicators in Dark Blue for strong contrast */}
            <div className="flex items-center gap-1.5 bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-900 text-xs text-amber-300 shadow-sm">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="font-mono font-bold">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-900 text-xs text-white shadow-sm">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">{wordCount}</span>
              <span className="text-blue-200">/ {targetWords}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-900 text-xs text-white shadow-sm">
              <AlignLeft className="h-4 w-4 text-amber-400" />
              <span className="font-bold">{paragraphCount}</span>
              <span className="text-blue-200">paras</span>
            </div>

            <div 
              className="flex items-center gap-1.5 bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-900 text-xs text-emerald-300 select-none shadow-sm"
              title="Copy-pasting is restricted to guarantee active skill acquisition"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold">Anti-Paste</span>
            </div>
          </div>
        </div>

        {/* Word Progress Bar */}
        <div className="w-full bg-amber-500/60 rounded-full h-2 overflow-hidden border border-amber-600/30">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              wordCount >= targetWords ? 'bg-blue-950 shadow-sm' : 'bg-blue-950'
            }`}
            style={{ width: `${wordProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Task 1 Visual Illustration Canvas (Line graph, Bar chart, Pie charts, Process diagrams, Map comparisons, Table) */}
      {(currentPrompt.type === 'TASK_1_ACADEMIC' || currentPrompt.illustrationType) && (
        <Task1VisualIllustration
          promptId={currentPrompt.id}
          illustrationType={currentPrompt.illustrationType}
          title={currentPrompt.title}
        />
      )}

      {/* Anti-Paste Pedagogical Notification Toast */}
      {pasteBlockedWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/95 border border-amber-300 dark:border-amber-500/60 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{pasteBlockedWarning}</span>
          </div>
          <button
            onClick={() => setPasteBlockedWarning(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-semibold shrink-0 transition-colors"
          >
            Got it
          </button>
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 min-h-[420px] flex flex-col">
        <textarea
          value={essayText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder={
            assistanceMode === 'ACTIVE_ASSISTANT'
              ? `Start drafting your Band ${targetBand} response here... Live Socratic feedback triggers continuously for each topic sentence, 2 sentences, 30 words, and paragraph completion.`
              : `Focus Exam Mode Active: Live feedback is muted. Draft under exam conditions and click "Submit Task" when finished.`
          }
          className="w-full flex-1 p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-gray-100 text-base leading-relaxed focus:outline-none focus:border-brand-500/80 placeholder-slate-400 dark:placeholder-gray-600 resize-none font-sans shadow-sm dark:shadow-inner tracking-wide"
        />

        {/* Live Assistant Floating Indicator */}
        <div className="absolute bottom-4 right-6 flex items-center gap-3">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/90 border border-brand-200 dark:border-brand-500/40 text-xs text-brand-700 dark:text-brand-300 shadow-lg animate-fadeIn">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500 dark:text-brand-400" />
              <span>Analyzing Band {targetBand} criteria...</span>
            </div>
          )}

          <button
            onClick={onSubmitTask}
            disabled={wordCount === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating Submission...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Task for Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
