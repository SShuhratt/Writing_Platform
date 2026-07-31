'use client';

import React, { useState } from 'react';
import { useWritingStore } from '@/lib/store';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { IELTSTaskPrompt, TaskType } from '@/types/ielts';
import { BookOpen, X, Clock, FileText, CheckCircle2, PlusCircle } from 'lucide-react';

interface PromptSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptSelectorModal: React.FC<PromptSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentPrompt, setPrompt } = useWritingStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [customTitle, setCustomTitle] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customType, setCustomType] = useState<TaskType>('TASK_2_ESSAY');

  if (!isOpen) return null;

  const filteredPrompts = OFFICIAL_PROMPTS_DATABASE.filter(p => {
    if (selectedCategory === 'TASK_1') return p.type === 'TASK_1_ACADEMIC' || p.type === 'TASK_1_GENERAL';
    if (selectedCategory === 'TASK_2') return p.type === 'TASK_2_ESSAY';
    return true;
  });

  const handleSelectPrompt = (prompt: IELTSTaskPrompt) => {
    setPrompt(prompt);
    onClose();
  };

  const handleCreateCustomPrompt = () => {
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

    setPrompt(newPrompt);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 border border-gray-700/80 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">IELTSTask Library</h3>
              <p className="text-xs text-gray-400">Select official prompts or define custom writing tasks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => { setSelectedCategory('ALL'); setIsCustomMode(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedCategory === 'ALL' && !isCustomMode ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              All Prompts ({OFFICIAL_PROMPTS_DATABASE.length})
            </button>
            <button
              onClick={() => { setSelectedCategory('TASK_2'); setIsCustomMode(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedCategory === 'TASK_2' && !isCustomMode ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Task 2 Essays
            </button>
            <button
              onClick={() => { setSelectedCategory('TASK_1'); setIsCustomMode(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedCategory === 'TASK_1' && !isCustomMode ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Task 1 (Academic & General)
            </button>
          </div>

          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isCustomMode ? 'bg-emerald-500 text-gray-950 border-emerald-400' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCustomMode ? 'View Prompt Library' : 'Create Custom Prompt'}</span>
          </button>
        </div>

        {/* Content Body */}
        {isCustomMode ? (
          <div className="space-y-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800 overflow-y-auto">
            <h4 className="text-sm font-bold text-emerald-400">Custom Task Setup</h4>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Task Type</label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as TaskType)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="TASK_2_ESSAY">Task 2 Essay (Min 250 words, 40 mins)</option>
                <option value="TASK_1_ACADEMIC">Task 1 Academic Graph/Chart (Min 150 words, 20 mins)</option>
                <option value="TASK_1_GENERAL">Task 1 General Letter (Min 150 words, 20 mins)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Topic Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Employment"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Official Question Text</label>
              <textarea
                rows={4}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Enter the full IELTS question prompt here..."
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-brand-500"
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
              return (
                <div
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-950/40 border-brand-500/80 shadow-lg shadow-brand-500/10'
                      : 'glass-card hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{prompt.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-800 text-brand-300 border border-gray-700">
                        {prompt.category}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {prompt.chartDescription && (
                    <p className="text-xs text-amber-300/90 italic mb-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {prompt.chartDescription}
                    </p>
                  )}

                  <p className="text-xs text-gray-300 leading-relaxed mb-3">
                    {prompt.questionText}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                      <span>Min {prompt.minWordCount} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <span>{prompt.recommendedTimeMinutes} mins recommended</span>
                    </div>
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
