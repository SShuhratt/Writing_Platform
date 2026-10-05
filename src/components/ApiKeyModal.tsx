'use client';

import React, { useState, useEffect } from 'react';
import { useWritingStore } from '@/lib/store';
import { Key, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { geminiApiKey, setGeminiApiKey } = useWritingStore();
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700/80 shadow-2xl relative text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Google Gemini API Setup</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Power real-time live AI guidance & dual-layer grading</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              API Key (Google AI Studio)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-400 dark:placeholder-gray-600 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Your key is saved locally in your browser context. If left blank, the platform automatically utilizes our Socratic Mock Engine for instant offline testing!
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              <span>Get a free Gemini API key</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
