'use client';

import React, { useMemo, useState } from 'react';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { AuthService } from '@/lib/auth-service';
import { IELTSTaskPrompt, TaskType } from '@/types/ielts';
import { CohortAssignment } from '@/types/b2b';
import { X, Search, PlusCircle, BookOpen, Calendar, MessageSquare, Loader2 } from 'lucide-react';

interface AssignPromptModalProps {
  isOpen: boolean;
  cohortId: string;
  cohortName: string;
  onClose: () => void;
  onAssigned: (assignment: CohortAssignment) => void;
}

/**
 * Modal enabling teachers to assign official or custom IELTS writing prompts to a student cohort.
 */
export const AssignPromptModal: React.FC<AssignPromptModalProps> = ({
  isOpen,
  cohortId,
  cohortName,
  onClose,
  onAssigned,
}) => {
  const [sourceMode, setSourceMode] = useState<'BANK' | 'CUSTOM'>('BANK');
  const [taskFilter, setTaskFilter] = useState<'ALL' | TaskType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>(OFFICIAL_PROMPTS_DATABASE[0].id);

  // Custom prompt fields
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<TaskType>('TASK_2_ESSAY');
  const [customCategory, setCustomCategory] = useState('School Mock Exam');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customMinWords, setCustomMinWords] = useState(250);

  // Assignment metadata
  const [teacherNotes, setTeacherNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredPrompts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return OFFICIAL_PROMPTS_DATABASE.filter((p) => {
      if (taskFilter !== 'ALL' && p.type !== taskFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.questionText.toLowerCase().includes(q)
      );
    }).slice(0, 40);
  }, [taskFilter, searchQuery]);

  if (!isOpen) return null;

  const selectedPrompt: IELTSTaskPrompt | undefined = OFFICIAL_PROMPTS_DATABASE.find(
    (p) => p.id === selectedPromptId
  );

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = AuthService.getStaffToken();
      const payload =
        sourceMode === 'BANK'
          ? {
              promptId: selectedPromptId,
              teacherNotes,
              dueDate,
            }
          : {
              prompt: {
                title: customTitle,
                type: customType,
                category: customCategory,
                questionText: customQuestion,
                minWordCount: customMinWords,
                recommendedTimeMinutes: customType === 'TASK_2_ESSAY' ? 40 : 20,
              },
              teacherNotes,
              dueDate,
            };

      const res = await fetch(`/api/cohorts/${encodeURIComponent(cohortId)}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.assignment) {
        setError(data.error || 'Could not assign prompt to cohort.');
        return;
      }

      onAssigned(data.assignment);
      setTeacherNotes('');
      setDueDate('');
      setCustomTitle('');
      setCustomQuestion('');
      onClose();
    } catch {
      setError('Network error while assigning prompt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-700/80 shadow-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span>Assign Writing Task</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Cohort: <strong className="text-slate-700 dark:text-gray-200">{cohortName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Source Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800/80 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSourceMode('BANK')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                sourceMode === 'BANK'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-gray-300'
              }`}
            >
              Official IELTS Prompt Bank ({OFFICIAL_PROMPTS_DATABASE.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('CUSTOM')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sourceMode === 'CUSTOM'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-gray-300'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Custom School Prompt</span>
            </button>
          </div>

          {sourceMode === 'BANK' ? (
            <div className="space-y-3">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topic, title, or keyword..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value as 'ALL' | TaskType)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs font-semibold"
                >
                  <option value="ALL">All Tasks</option>
                  <option value="TASK_2_ESSAY">Task 2 Essay</option>
                  <option value="TASK_1_ACADEMIC">Task 1 Academic</option>
                  <option value="TASK_1_GENERAL">Task 1 General</option>
                </select>
              </div>

              {/* Prompt Picker List */}
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {filteredPrompts.map((p) => {
                  const isSelected = p.id === selectedPromptId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPromptId(p.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-slate-50 dark:bg-gray-950/60 border-slate-200 dark:border-gray-800 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {p.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 shrink-0">
                          {p.type === 'TASK_2_ESSAY'
                            ? 'Task 2'
                            : p.type === 'TASK_1_ACADEMIC'
                            ? 'Academic T1'
                            : 'General T1'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-gray-400 line-clamp-2">
                        {p.questionText}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedPrompt && (
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs">
                  <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-0.5">
                    Selected: {selectedPrompt.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-gray-300">
                    {selectedPrompt.questionText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Week 4 Mock — Renewable Subsidies"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Task Type</label>
                    <select
                      value={customType}
                      onChange={(e) => {
                        const t = e.target.value as TaskType;
                        setCustomType(t);
                        setCustomMinWords(t === 'TASK_2_ESSAY' ? 250 : 150);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
                    >
                      <option value="TASK_2_ESSAY">Task 2 Essay</option>
                      <option value="TASK_1_ACADEMIC">Task 1 Academic</option>
                      <option value="TASK_1_GENERAL">Task 1 General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Min Words</label>
                    <input
                      type="number"
                      min={100}
                      max={500}
                      value={customMinWords}
                      onChange={(e) => setCustomMinWords(Number(e.target.value) || 250)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Category / Curriculum Module</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Exam Question Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Enter full IELTS task instructions for your cohort..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
                />
              </div>
            </div>
          )}

          {/* Instructor Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-gray-800">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                <span>Teacher Instructions (Optional)</span>
              </label>
              <input
                type="text"
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="e.g. Emphasize concessive clauses and Band 7.5 collocations"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                <span>Due Date (Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Assign to Cohort</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

