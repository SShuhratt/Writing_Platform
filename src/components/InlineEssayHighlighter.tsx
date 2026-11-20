'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SentenceAnnotation, SentenceAnnotationType, SubmissionReport } from '@/types/ielts';
import {
  buildAnnotatedParagraphs,
  generateFallbackSentenceAnnotations,
  normalizeSentenceAnnotations,
} from '@/lib/sentence-annotations';
import {
  Highlighter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Check,
  Copy,
} from 'lucide-react';

interface InlineEssayHighlighterProps {
  report: SubmissionReport;
}

interface AnnotationStyleConfig {
  label: string;
  dotClass: string;
  badgeClass: string;
  inlineClass: string;
  activeRingClass: string;
  filterActiveClass: string;
  icon: React.ReactNode;
}

const ANNOTATION_TYPES_ORDER: SentenceAnnotationType[] = [
  'ERROR',
  'COLLOCATION',
  'COHERENCE',
  'STRENGTH',
];

const ANNOTATION_STYLES: Record<SentenceAnnotationType, AnnotationStyleConfig> = {
  ERROR: {
    label: 'Grammar & Errors',
    dotClass: 'bg-rose-500',
    badgeClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    inlineClass:
      'bg-rose-100/90 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-b-2 border-rose-500 hover:bg-rose-200/80 dark:hover:bg-rose-900/70',
    activeRingClass: 'ring-2 ring-rose-500/70 bg-rose-200 dark:bg-rose-900/85',
    filterActiveClass:
      'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/25',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  COLLOCATION: {
    label: 'Collocation Upgrades',
    dotClass: 'bg-purple-500',
    badgeClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    inlineClass:
      'bg-purple-100/90 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 border-b-2 border-purple-500 hover:bg-purple-200/80 dark:hover:bg-purple-900/70',
    activeRingClass: 'ring-2 ring-purple-500/70 bg-purple-200 dark:bg-purple-900/85',
    filterActiveClass:
      'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/25',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  COHERENCE: {
    label: 'Coherence & Flow',
    dotClass: 'bg-sky-500',
    badgeClass:
      'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
    inlineClass:
      'bg-sky-100/90 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 border-b-2 border-sky-500 hover:bg-sky-200/80 dark:hover:bg-sky-900/70',
    activeRingClass: 'ring-2 ring-sky-500/70 bg-sky-200 dark:bg-sky-900/85',
    filterActiveClass:
      'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/25',
    icon: <GitBranch className="h-3.5 w-3.5" />,
  },
  STRENGTH: {
    label: 'Band 7.5+ Strengths',
    dotClass: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    inlineClass:
      'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border-b-2 border-emerald-500 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/70',
    activeRingClass: 'ring-2 ring-emerald-500/70 bg-emerald-200 dark:bg-emerald-900/85',
    filterActiveClass:
      'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

const CRITERION_LABELS: Record<SentenceAnnotation['criterion'], string> = {
  TR: 'Task Response',
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range & Accuracy',
};

/**
 * Interactive Layer 2 inline essay markup card highlighting grammar slips, academic collocation
 * opportunities, coherence issues, and Band 7.5+ strengths directly inside the candidate's essay.
 */
export const InlineEssayHighlighter: React.FC<InlineEssayHighlighterProps> = ({ report }) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | SentenceAnnotationType>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedSuggestion, setCopiedSuggestion] = useState<boolean>(false);

  const allAnnotations = useMemo(() => {
    const lexicalUpgrades = report.layer2AlignmentReport.specificRecommendations?.lexicalUpgrades;
    const stored = report.layer2AlignmentReport.sentenceAnnotations;
    if (Array.isArray(stored) && stored.length > 0) {
      return normalizeSentenceAnnotations(report.essayText, stored, lexicalUpgrades);
    }
    return generateFallbackSentenceAnnotations(report.essayText, lexicalUpgrades);
  }, [report]);

  const { matchedAnnotations: allMatched } = useMemo(
    () => buildAnnotatedParagraphs(report.essayText, allAnnotations),
    [report.essayText, allAnnotations]
  );

  const typeCounts = useMemo(() => {
    const counts: Record<SentenceAnnotationType, number> = {
      ERROR: 0,
      COLLOCATION: 0,
      COHERENCE: 0,
      STRENGTH: 0,
    };
    for (const item of allMatched) {
      counts[item.type]++;
    }
    return counts;
  }, [allMatched]);

  const filteredAnnotations = useMemo(
    () =>
      activeFilter === 'ALL'
        ? allAnnotations
        : allAnnotations.filter((item) => item.type === activeFilter),
    [allAnnotations, activeFilter]
  );

  const { paragraphs, matchedAnnotations } = useMemo(
    () => buildAnnotatedParagraphs(report.essayText, filteredAnnotations),
    [report.essayText, filteredAnnotations]
  );

  useEffect(() => {
    if (matchedAnnotations.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillVisible = matchedAnnotations.some((ann) => ann.id === selectedId);
    if (!stillVisible) {
      setSelectedId(matchedAnnotations[0].id);
    }
  }, [matchedAnnotations, selectedId]);

  const activeIndex = useMemo(() => {
    if (matchedAnnotations.length === 0) return -1;
    const idx = matchedAnnotations.findIndex((ann) => ann.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [matchedAnnotations, selectedId]);

  const activeAnnotation = activeIndex >= 0 ? matchedAnnotations[activeIndex] : null;

  const handleStepAnnotation = (delta: number) => {
    if (matchedAnnotations.length === 0) return;
    const nextIndex =
      (activeIndex + delta + matchedAnnotations.length) % matchedAnnotations.length;
    setSelectedId(matchedAnnotations[nextIndex].id);
  };

  const handleCopySuggestion = async (suggestionText: string) => {
    try {
      await navigator.clipboard.writeText(suggestionText);
      setCopiedSuggestion(true);
      setTimeout(() => setCopiedSuggestion(false), 2000);
    } catch (err) {
      console.warn('Copy suggestion failed:', err);
    }
  };

  if (!report.essayText.trim()) return null;

  return (
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-800 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Highlighter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Inline Sentence Error &amp; Collocation Highlights
        </h4>
        <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">
          Click any highlighted span to inspect Band 7.5+ examiner corrections
        </span>
      </div>

      {/* Category Filter Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-950 border-slate-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-gray-800/80 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800'
          }`}
        >
          <span>All Highlights</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeFilter === 'ALL'
                ? 'bg-white/20 dark:bg-black/10'
                : 'bg-slate-200 dark:bg-gray-700'
            }`}
          >
            {allMatched.length}
          </span>
        </button>

        {ANNOTATION_TYPES_ORDER.map((type) => {
          const style = ANNOTATION_STYLES[type];
          const count = typeCounts[type];
          const isSelected = activeFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveFilter(isSelected ? 'ALL' : type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? style.filterActiveClass
                  : 'bg-white dark:bg-gray-800/80 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelected ? 'bg-white' : style.dotClass
                }`}
              />
              <span>{style.label}</span>
              <span className="opacity-75 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Candidate Essay with Inline Interactive Spans */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-gray-950/75 border border-slate-200 dark:border-gray-800 space-y-3 max-h-80 overflow-y-auto">
        {paragraphs.map((para) => (
          <p
            key={para.paragraphIndex}
            className="text-xs sm:text-[13px] text-slate-800 dark:text-gray-200 leading-7 font-serif"
          >
            {para.segments.map((seg, segIdx) => {
              if (!seg.annotation) {
                return <React.Fragment key={segIdx}>{seg.text}</React.Fragment>;
              }
              const style = ANNOTATION_STYLES[seg.annotation.type];
              const isSelected = activeAnnotation?.id === seg.annotation.id;
              return (
                <button
                  key={`${seg.annotation.id}-${segIdx}`}
                  type="button"
                  onClick={() => setSelectedId(seg.annotation!.id)}
                  title={`${seg.annotation.issueLabel} — Click to inspect feedback`}
                  className={`inline text-left font-serif rounded px-1 py-0.5 transition-all cursor-pointer ${
                    style.inlineClass
                  } ${isSelected ? style.activeRingClass : ''}`}
                >
                  {seg.text}
                </button>
              );
            })}
          </p>
        ))}
      </div>

      {/* Selected Annotation Examiner Inspector */}
      {activeAnnotation ? (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700/70 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  ANNOTATION_STYLES[activeAnnotation.type].badgeClass
                }`}
              >
                {ANNOTATION_STYLES[activeAnnotation.type].icon}
                <span>{ANNOTATION_STYLES[activeAnnotation.type].label}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-[10px] font-bold border border-slate-200 dark:border-gray-700">
                {activeAnnotation.criterion} • {CRITERION_LABELS[activeAnnotation.criterion]}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {activeAnnotation.issueLabel}
              </span>
            </div>

            {/* Previous / Next Navigation */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 mr-1">
                {activeIndex + 1} / {matchedAnnotations.length}
              </span>
              <button
                type="button"
                onClick={() => handleStepAnnotation(-1)}
                disabled={matchedAnnotations.length <= 1}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-900 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 disabled:opacity-40 transition-colors"
                title="Previous highlighted span"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStepAnnotation(1)}
                disabled={matchedAnnotations.length <= 1}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-900 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 disabled:opacity-40 transition-colors"
                title="Next highlighted span"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700/60 italic text-slate-700 dark:text-gray-300">
              &ldquo;{activeAnnotation.exactQuote}&rdquo;
            </div>
            <p>{activeAnnotation.explanation}</p>
          </div>

          {activeAnnotation.suggestion && (
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start justify-between gap-3">
              <div className="space-y-0.5 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Suggested Band 7.5+ Upgrade
                </div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                  {activeAnnotation.suggestion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopySuggestion(activeAnnotation.suggestion!)}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 transition-colors"
                title="Copy suggested phrase"
              >
                {copiedSuggestion ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700/60 text-xs text-slate-500 dark:text-gray-400">
          No highlights matched the selected filter ({activeFilter === 'ALL' ? 'all categories' : ANNOTATION_STYLES[activeFilter].label}).
        </div>
      )}
    </div>
  );
};

