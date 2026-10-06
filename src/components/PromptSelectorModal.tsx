'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWritingStore } from '@/lib/store';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { IELTSTaskPrompt, TaskType } from '@/types/ielts';
import { BookOpen, X, Clock, FileText, CheckCircle2, PlusCircle, Eye, Search, Database } from 'lucide-react';
import { Task1VisualIllustration } from './Task1VisualIllustration';

interface PromptSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptSelectorModal: React.FC<PromptSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentPrompt, setPrompt } = useWritingStore();
  const [promptsList, setPromptsList] = useState<IELTSTaskPrompt[]>(OFFICIAL_PROMPTS_DATABASE);
  const [dataSource, setDataSource] = useState<'supabase' | 'fallback'>('fallback');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [previewDiagramPromptId, setPreviewDiagramPromptId] = useState<string | null>(null);

  const [customTitle, setCustomTitle] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customType, setCustomType] = useState<TaskType>('TASK_2_ESSAY');

  // Fetch from /api/prompts on mount or modal open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadPrompts() {
      try {
        const res = await fetch('/api/prompts?limit=250');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.prompts && data.prompts.length > 0) {
            setPromptsList(data.prompts);
            if (data.source) setDataSource(data.source);
          }
        }
      } catch (err) {
        console.warn('Fallback to local prompts database:', err);
      }
    }

    loadPrompts();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Extract unique topic categories for high-level filtering
  const subCategories = useMemo(() => {
    const cats = new Set<string>();
    promptsList.forEach(p => {
      // Split off parenthetical type if present: e.g. "Education & Higher Learning (Agree / Disagree)" -> "Education & Higher Learning"
      const mainCat = p.category.split('(')[0].trim();
      if (mainCat) cats.add(mainCat);
    });
    return Array.from(cats).sort();
  }, [promptsList]);

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return promptsList.filter(p => {
      // Task Type filter
      if (selectedTaskType === 'TASK_1' && !(p.type === 'TASK_1_ACADEMIC' || p.type === 'TASK_1_GENERAL')) {
        return false;
      }
      if (selectedTaskType === 'TASK_2' && p.type !== 'TASK_2_ESSAY') {
        return false;
      }

      // Sub-category filter
      if (selectedSubCategory !== 'ALL') {
        const mainCat = p.category.split('(')[0].trim().toLowerCase();
        if (!mainCat.includes(selectedSubCategory.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesQuestion = p.questionText.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesQuestion && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [promptsList, selectedTaskType, selectedSubCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelectPrompt = (prompt: IELTSTaskPrompt) => {
    setPrompt(prompt);
    onClose();
  };

  const handleCreateCustomPrompt = async () => {
    if (!customTitle || !customQuestion) return;

    const newPrompt: IELTSTaskPrompt = {
      id: `custom-${Date.now()}`,
      title: customTitle,
      type: customType,
      category: 'Custom Practice Task',
      questionText: customQuestion,
      minWordCount: customType === 'TASK_2_ESSAY' ? 250 : 150,
      recommendedTimeMinutes: customType === 'TASK_2_ESSAY' ? 40 : 20,
    };

    // Attempt to persist to API
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });
    } catch {
      // Offline fallback
    }

    setPrompt(newPrompt);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700/80 shadow-2xl relative max-h-[90vh] flex flex-col text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 dark:bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">IELTS Task Library</h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
                  <Database className="h-3 w-3 text-emerald-500" />
                  <span>{promptsList.length} Prompts ({dataSource === 'supabase' ? 'Supabase DB' : 'Bundled DB'})</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Browse 150 Task 2 topics, 10 Task 1 visual charts/letters, or enter custom prompts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across 160 topics by keyword (e.g. 'artificial intelligence', 'education', 'pollution')..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                isCustomMode ? 'bg-emerald-500 text-gray-950 border-emerald-400' : 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isCustomMode ? 'View Prompt Library' : 'Custom Task'}</span>
            </button>
          </div>

          {/* Tab Filters and Category Dropdown */}
          {!isCustomMode && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-gray-900/90 p-1 rounded-xl border border-slate-200 dark:border-gray-800">
                <button
                  onClick={() => setSelectedTaskType('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${selectedTaskType === 'ALL' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  All ({promptsList.length})
                </button>
                <button
                  onClick={() => setSelectedTaskType('TASK_2')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${selectedTaskType === 'TASK_2' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  Task 2 Essays (150)
                </button>
                <button
                  onClick={() => setSelectedTaskType('TASK_1')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${selectedTaskType === 'TASK_1' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  Task 1 Charts & Letters (10)
                </button>
              </div>

              {/* Sub-category selector */}
              {selectedTaskType !== 'TASK_1' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Topic:</span>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="ALL">All Categories</option>
                    {subCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">
                Showing {filteredPrompts.length} matches
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        {isCustomMode ? (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 overflow-y-auto">
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Custom Task Setup</h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Task Type</label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as TaskType)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="TASK_2_ESSAY">Task 2 Essay (Min 250 words, 40 mins)</option>
                <option value="TASK_1_ACADEMIC">Task 1 Academic Graph/Chart (Min 150 words, 20 mins)</option>
                <option value="TASK_1_GENERAL">Task 1 General Letter (Min 150 words, 20 mins)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Topic Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Employment"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Official Question Text</label>
              <textarea
                rows={4}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Enter the full IELTS question prompt here..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreateCustomPrompt}
                disabled={!customTitle || !customQuestion}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs disabled:opacity-50 transition-all"
              >
                Use Custom Prompt
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {filteredPrompts.map((prompt) => {
              const isSelected = currentPrompt.id === prompt.id;
              const hasIllustration = !!prompt.illustrationType;
              const isPreviewOpen = previewDiagramPromptId === prompt.id;

              return (
                <div
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`p-4 md:p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-400 dark:bg-amber-400 border-2 border-amber-500 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/50'
                      : 'bg-white dark:bg-gray-900/70 border-slate-200 dark:border-gray-800 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black text-sm md:text-base ${
                        isSelected ? 'text-slate-950' : 'text-slate-900 dark:text-white'
                      }`}>
                        {prompt.title}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        isSelected
                          ? 'bg-blue-950 text-white border-blue-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-gray-800 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-gray-700'
                      }`}>
                        {prompt.category}
                      </span>
                      {hasIllustration && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-blue-900/90 text-amber-200 border-blue-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                        }`}>
                          <Eye className="h-3 w-3" />
                          <span>Visual Diagram</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasIllustration && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDiagramPromptId(isPreviewOpen ? null : prompt.id);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-blue-950 text-amber-300 border-blue-900 hover:bg-blue-900'
                              : 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-200'
                          }`}
                        >
                          {isPreviewOpen ? 'Hide Diagram' : 'Preview Diagram'}
                        </button>
                      )}

                      {isSelected && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-950 text-amber-300 shadow-md">
                          <CheckCircle2 className="h-4 w-4 text-amber-400" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {prompt.chartDescription && (
                    <div className={`text-xs italic mb-2.5 p-3 rounded-xl border leading-relaxed ${
                      isSelected
                        ? 'bg-amber-200/90 text-blue-950 border-amber-500/60 font-semibold'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/40 font-medium'
                    }`}>
                      {prompt.chartDescription}
                    </div>
                  )}

                  {/* Inline Diagram Preview if toggled */}
                  {hasIllustration && isPreviewOpen && (
                    <div
                      className="my-3 p-2 rounded-xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-700 shadow-inner"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Task1VisualIllustration
                        promptId={prompt.id}
                        illustrationType={prompt.illustrationType}
                        title={prompt.title}
                        compact={true}
                      />
                    </div>
                  )}

                  <p className={`text-xs leading-relaxed mb-3 ${
                    isSelected ? 'text-slate-950 font-semibold' : 'text-slate-600 dark:text-gray-300'
                  }`}>
                    {prompt.questionText}
                  </p>

                  <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
                    isSelected
                      ? 'border-amber-500/40 text-blue-950 font-bold'
                      : 'border-slate-100 dark:border-gray-800/80 text-slate-500 dark:text-gray-400'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <FileText className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-950' : 'text-slate-400 dark:text-gray-500'}`} />
                      <span>Min {prompt.minWordCount} words</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-950' : 'text-slate-400 dark:text-gray-500'}`} />
                      <span>{prompt.recommendedTimeMinutes} mins recommended</span>
                    </div>
                    {prompt.type === 'TASK_1_ACADEMIC' && (
                      <span className={`ml-auto font-black ${isSelected ? 'text-blue-950' : 'text-blue-600 dark:text-blue-400'}`}>
                        Task 1 Academic
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
