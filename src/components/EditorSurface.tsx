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
  BookOpen,
  Zap
} from 'lucide-react';

interface EditorSurfaceProps {
  onSubmitTask: () => void;
  onOpenPromptsModal?: () => void;
  isModalOpen?: boolean;
}

const SOCRATIC_COOLDOWN_MS = 12_000;

export const EditorSurface: React.FC<EditorSurfaceProps> = ({
  onSubmitTask,
  onOpenPromptsModal,
  isModalOpen = false,
}) => {
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
    isSubmitting,
    currentUser,
    activePlanCode,
    dailyEvaluationLimit,
    setUpgradeModalOpen,
    getRemainingDailyEvaluations
  } = useWritingStore();

  const [pasteBlockedWarning, setPasteBlockedWarning] = useState<string | null>(null);
  const [guidanceNotice, setGuidanceNotice] = useState<string | null>(null);
  const [showShortEssayConfirm, setShowShortEssayConfirm] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const pasteWarningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const internalClipboardRef = useRef<string | null>(null);
  const guidanceAbortRef = useRef<AbortController | null>(null);
  const lastGuidanceTriggerAtRef = useRef<number>(0);

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevParagraphCountRef = useRef<number>(0);
  const lastEvaluatedSentenceCountRef = useRef<number>(0);
  const lastEvaluated30WordBucketRef = useRef<number>(0);
  const lastEvaluatedTopicSentenceParaIndexRef = useRef<number>(0);
  const checkedConclusionRef = useRef<boolean>(false);
  const lastEvaluatedWordCountRef = useRef<number>(0);

  // Reset Milestone Tracking Refs on Essay Reset or Prompt Switch
  useEffect(() => {
    if (essayText.length === 0) {
      prevParagraphCountRef.current = 0;
      lastEvaluatedSentenceCountRef.current = 0;
      lastEvaluated30WordBucketRef.current = 0;
      lastEvaluatedTopicSentenceParaIndexRef.current = 0;
      checkedConclusionRef.current = false;
      lastEvaluatedWordCountRef.current = 0;
      setGuidanceNotice(null);
      setShowShortEssayConfirm(false);
    }
  }, [essayText, currentPrompt.id]);

  // Track tab visibility so timer pauses automatically when backgrounded
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => setIsPageHidden(document.hidden);
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Abort in-flight guidance & cleanup timers on unmount
  useEffect(() => {
    return () => {
      guidanceAbortRef.current?.abort();
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (pasteWarningTimerRef.current) clearTimeout(pasteWarningTimerRef.current);
    };
  }, []);

  // Timer Tick Hook (pauses when tab hidden, modal open, or submission in flight)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isModalOpen && !isPageHidden && !isSubmitting) {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isModalOpen, isPageHidden, isSubmitting, incrementTimer]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  // Trigger Asynchronous Realtime Analysis (Workflow 3.1 & 3.4)
  const triggerAnalysis = async (currentText: string, _triggerReason?: string, bypassCooldown = false) => {
    if (assistanceMode === 'FOCUS_EXAM') return;
    const currentWords = currentText.trim().split(/\s+/).filter(Boolean).length;
    if (currentWords < 15) return; // Baseline minimum words for meaningful feedback

    const now = Date.now();
    if (!bypassCooldown && now - lastGuidanceTriggerAtRef.current < SOCRATIC_COOLDOWN_MS) {
      return;
    }

    guidanceAbortRef.current?.abort();
    const controller = new AbortController();
    guidanceAbortRef.current = controller;
    lastGuidanceTriggerAtRef.current = now;
    lastEvaluatedWordCountRef.current = currentWords;
    setIsAnalyzing(true);
    setGuidanceNotice(null);

    try {
      const res = await generateRealtimeGuidance({
        essayText: currentText,
        targetBand,
        prompt: currentPrompt,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (res.cards) {
        setGuidanceCards(res.cards);
      }
      if (res.levelOffer !== undefined) {
        setLevelOffer(res.levelOffer);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      if (err?.status === 429) {
        setGuidanceNotice('Daily Socratic coaching limit reached. You can continue drafting or submit for grading.');
      } else if (err?.status === 401) {
        setGuidanceNotice('Sign in to activate live AI Socratic coaching.');
      } else {
        setGuidanceNotice('Live Socratic coach is temporarily unavailable. Keep writing safely—auto-save is active.');
      }
    } finally {
      if (guidanceAbortRef.current === controller) {
        setIsAnalyzing(false);
      }
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

  const captureInternalSelection = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    if (end > start) {
      internalClipboardRef.current = textarea.value.slice(start, end);
    }
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    captureInternalSelection(e.currentTarget);
  };

  const handleCut = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    captureInternalSelection(e.currentTarget);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');
    if (
      pastedText.length > 0 &&
      internalClipboardRef.current !== null &&
      pastedText === internalClipboardRef.current
    ) {
      // Allow rearranging sentences cut/copied from inside this editor
      return;
    }
    e.preventDefault();
    triggerPasteBlockedWarning();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    triggerPasteBlockedWarning();
  };

  // Keyboard shortcut handler: Tab key creates paragraph indent (4 spaces) like Word instead of shifting focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;
      const tabSpacing = '    '; // Standard 4 spaces paragraph indentation

      if (e.shiftKey) {
        // Shift + Tab: Outdent
        const beforeCursor = value.substring(0, selectionStart);
        if (beforeCursor.endsWith(tabSpacing)) {
          const newText = beforeCursor.slice(0, -tabSpacing.length) + value.substring(selectionStart);
          updateEssayText(newText);
          const newPos = selectionStart - tabSpacing.length;
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = newPos;
          });
        } else if (beforeCursor.endsWith(' ')) {
          const match = beforeCursor.match(/ +$/);
          const spacesToRemove = match ? Math.min(match[0].length, tabSpacing.length) : 0;
          if (spacesToRemove > 0) {
            const newText = beforeCursor.slice(0, -spacesToRemove) + value.substring(selectionStart);
            updateEssayText(newText);
            const newPos = selectionStart - spacesToRemove;
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = newPos;
            });
          }
        }
        return;
      }

      // Tab: Indent (Insert 4 spaces at cursor)
      if (selectionStart === selectionEnd) {
        const newText = value.substring(0, selectionStart) + tabSpacing + value.substring(selectionEnd);
        updateEssayText(newText);

        if (!isTimerRunning && newText.length > 0) {
          setTimerRunning(true);
        }

        const newPos = selectionStart + tabSpacing.length;
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
        });
      } else {
        // Multi-line selection or block indentation
        const startLineIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const endLineIndex = value.indexOf('\n', selectionEnd);
        const actualEndIndex = endLineIndex === -1 ? value.length : endLineIndex;

        const selectedBlock = value.substring(startLineIndex, actualEndIndex);
        const lines = selectedBlock.split('\n');
        const indentedLines = lines.map(line => tabSpacing + line).join('\n');

        const newText = value.substring(0, startLineIndex) + indentedLines + value.substring(actualEndIndex);
        updateEssayText(newText);

        if (!isTimerRunning && newText.length > 0) {
          setTimerRunning(true);
        }

        requestAnimationFrame(() => {
          textarea.selectionStart = startLineIndex;
          textarea.selectionEnd = startLineIndex + indentedLines.length;
        });
      }
    }
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
      if (activeParaSentences >= 1 && currentParagraphs > lastEvaluatedTopicSentenceParaIndexRef.current) {
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
    if (currentParagraphs < lastEvaluatedTopicSentenceParaIndexRef.current) {
      lastEvaluatedTopicSentenceParaIndexRef.current = currentParagraphs;
    }
    if (!isConclusionTyped(newText)) {
      checkedConclusionRef.current = false;
    }

    // Continuous Typing Pause Trigger (7 Seconds debounce, requires >= 15 word delta)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      if (currentWords >= 15 && Math.abs(currentWords - lastEvaluatedWordCountRef.current) >= 15) {
        triggerAnalysis(newText, 'Typing Pause');
      }
    }, 7000);
  };

  // Re-trigger analysis IMMEDIATELY when Target Band or Assistance Mode changes mid-task
  useEffect(() => {
    const currentWords = essayText.trim().split(/\s+/).filter(Boolean).length;
    if (currentWords >= 15 && assistanceMode === 'ACTIVE_ASSISTANT') {
      triggerAnalysis(essayText, 'Dynamic Band Target Change', true);
    }
  }, [targetBand, assistanceMode]);

  const handleRequestSubmit = () => {
    if (wordCount === 0 || isSubmitting) return;
    if (wordCount < 50) {
      setShowShortEssayConfirm(true);
      return;
    }
    onSubmitTask();
  };

  const targetWords = currentPrompt.minWordCount;
  const wordProgressPercent = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const remainingQuota = getRemainingDailyEvaluations();
  const isAdmin = currentUser?.role === 'admin';

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
              wordCount >= targetWords ? 'bg-emerald-600 shadow-sm' : 'bg-blue-950'
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

      {guidanceNotice && (
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-gray-800/90 border border-slate-200 dark:border-gray-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
          <span>{guidanceNotice}</span>
          <button
            type="button"
            onClick={() => setGuidanceNotice(null)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {showShortEssayConfirm && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
            <strong>Submit incomplete draft ({wordCount} words)?</strong> Official IELTS requires at least {targetWords} words; responses under 50 words receive a severe Task Response band penalty and still consume 1 daily evaluation credit.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowShortEssayConfirm(false)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/40 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              Continue Writing
            </button>
            <button
              type="button"
              onClick={() => {
                setShowShortEssayConfirm(false);
                onSubmitTask();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      )}

      {/* Main Textarea Canvas */}
      <div className="relative flex-1 min-h-[420px] flex flex-col">
        <textarea
          value={essayText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onCopy={handleCopy}
          onCut={handleCut}
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
          {/* Daily Quota & Plan Badge */}
          <button
            type="button"
            onClick={() => !isAdmin && setUpgradeModalOpen(true)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isAdmin
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 cursor-default'
                : activePlanCode !== 'FREE'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                : remainingQuota > 0
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20'
            }`}
            title={
              isAdmin
                ? 'Staff Account: Unlimited Evaluations'
                : `${remainingQuota} of ${dailyEvaluationLimit} daily AI evaluations remaining (${activePlanCode}). Click to manage plan or redeem voucher.`
            }
          >
            <Zap className={`h-3.5 w-3.5 ${activePlanCode !== 'FREE' ? 'text-emerald-500' : remainingQuota > 0 ? 'text-amber-500' : 'text-rose-500'}`} />
            <span>
              {isAdmin
                ? 'Unlimited'
                : activePlanCode !== 'FREE'
                ? `Pro • ${remainingQuota}/${dailyEvaluationLimit}`
                : `${remainingQuota}/${dailyEvaluationLimit} Free Left`}
            </span>
          </button>

          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/90 border border-brand-200 dark:border-brand-500/40 text-xs text-brand-700 dark:text-brand-300 shadow-lg animate-fadeIn">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500 dark:text-brand-400" />
              <span>Analyzing Band {targetBand} criteria...</span>
            </div>
          )}

          <button
            onClick={handleRequestSubmit}
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
