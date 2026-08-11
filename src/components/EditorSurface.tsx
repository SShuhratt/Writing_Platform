'use client';

import React, { useEffect, useRef } from 'react';
import { useWritingStore } from '@/lib/store';
import { generateRealtimeGuidance } from '@/lib/ai-service';
import { 
  Clock, 
  FileText, 
  AlignLeft, 
  TrendingUp, 
  TrendingDown, 
  Send, 
  Loader2
} from 'lucide-react';

interface EditorSurfaceProps {
  onSubmitTask: () => void;
}

export const EditorSurface: React.FC<EditorSurfaceProps> = ({ onSubmitTask }) => {
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
    geminiApiKey,
    isAnalyzing,
    setIsAnalyzing,
    setGuidanceCards,
    levelOffer,
    setLevelOffer,
    isSubmitting
  } = useWritingStore();

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevParagraphCountRef = useRef<number>(0);
  const lastEvaluatedSentenceCountRef = useRef<number>(0);
  const lastEvaluated50WordBucketRef = useRef<number>(0);
  const lastEvaluatedTopicSentenceParaIndexRef = useRef<number>(0);
  const checkedConclusionRef = useRef<boolean>(false);

  // Reset Milestone Tracking Refs on Essay Reset
  useEffect(() => {
    if (essayText.length === 0) {
      prevParagraphCountRef.current = 0;
      lastEvaluatedSentenceCountRef.current = 0;
      lastEvaluated50WordBucketRef.current = 0;
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
        apiKey: geminiApiKey,
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

    // Trigger Condition 1: EACH 50 Words Milestone (50, 100, 150, 200, 250, 300...)
    const current50Bucket = Math.floor(currentWords / 50);
    if (current50Bucket > lastEvaluated50WordBucketRef.current && current50Bucket > 0) {
      lastEvaluated50WordBucketRef.current = current50Bucket;
      shouldTriggerImmediately = true;
      triggerReason = `Milestone: ${current50Bucket * 50} Words Reached`;
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
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-start gap-3">
            {levelOffer.type === 'UPWARD' ? (
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="font-bold text-sm">
                {levelOffer.type === 'UPWARD' ? 'Target Upgrade Recommendation' : 'Adaptive Band Recalibration'}
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                {levelOffer.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLevelOffer(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
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

      {/* Editor Main Canvas Header */}
      <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400 mb-1">
              <span>{currentPrompt.category}</span>
              <span>•</span>
              <span className="text-gray-400">Recommended: {currentPrompt.recommendedTimeMinutes} mins</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">
              {currentPrompt.questionText}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Stats Indicators */}
            <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-300">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span className="font-mono font-bold">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-300">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">{wordCount}</span>
              <span className="text-gray-500">/ {targetWords} words</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-300">
              <AlignLeft className="h-4 w-4 text-amber-400" />
              <span className="font-bold">{paragraphCount}</span>
              <span className="text-gray-500">paras</span>
            </div>
          </div>
        </div>

        {/* Word Progress Bar */}
        <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              wordCount >= targetWords ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-brand-500'
            }`}
            style={{ width: `${wordProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 min-h-[420px] flex flex-col">
        <textarea
          value={essayText}
          onChange={handleTextChange}
          placeholder={
            assistanceMode === 'ACTIVE_ASSISTANT'
              ? `Start drafting your Band ${targetBand} response here... Live Socratic feedback triggers continuously for each topic sentence, 2 sentences, 50 words, and paragraph completion.`
              : `Focus Exam Mode Active: Live feedback is muted. Draft under exam conditions and click "Submit Task" when finished.`
          }
          className="w-full flex-1 p-6 rounded-2xl bg-gray-900/80 border border-gray-800 text-gray-100 text-base leading-relaxed focus:outline-none focus:border-brand-500/80 placeholder-gray-600 resize-none font-sans shadow-inner tracking-wide"
        />

        {/* Live Assistant Floating Indicator */}
        <div className="absolute bottom-4 right-6 flex items-center gap-3">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-950/90 border border-brand-500/40 text-xs text-brand-300 shadow-lg animate-fadeIn">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
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
