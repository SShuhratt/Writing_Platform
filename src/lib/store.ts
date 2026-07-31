import { create } from 'zustand';
import { TargetBand, AssistanceMode, IELTSTaskPrompt, SocraticGuidanceCard, LevelOfferAlert, SubmissionReport } from '@/types/ielts';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';

interface WritingState {
  // Config state
  targetBand: TargetBand;
  assistanceMode: AssistanceMode;
  currentPrompt: IELTSTaskPrompt;
  geminiApiKey: string;

  // Active Writing State
  essayText: string;
  wordCount: number;
  paragraphCount: number;
  elapsedSeconds: number;
  isTimerRunning: boolean;

  // Guidance State
  isAnalyzing: boolean;
  guidanceCards: SocraticGuidanceCard[];
  levelOffer: LevelOfferAlert | null;

  // Evaluation & History
  isSubmitting: boolean;
  activeReport: SubmissionReport | null;
  history: SubmissionReport[];

  // Actions
  setTargetBand: (band: TargetBand) => void;
  setAssistanceMode: (mode: AssistanceMode) => void;
  setPrompt: (prompt: IELTSTaskPrompt) => void;
  setGeminiApiKey: (key: string) => void;

  updateEssayText: (text: string) => void;
  setTimerRunning: (running: boolean) => void;
  incrementTimer: () => void;
  resetTimer: () => void;

  setGuidanceCards: (cards: SocraticGuidanceCard[]) => void;
  addGuidanceCard: (card: SocraticGuidanceCard) => void;
  clearGuidanceCard: (cardId: string) => void;
  setLevelOffer: (offer: LevelOfferAlert | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;

  setIsSubmitting: (submitting: boolean) => void;
  setActiveReport: (report: SubmissionReport | null) => void;
  resetSession: () => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  targetBand: '7.0',
  assistanceMode: 'ACTIVE_ASSISTANT',
  currentPrompt: OFFICIAL_PROMPTS_DATABASE[0],
  geminiApiKey: '',

  essayText: '',
  wordCount: 0,
  paragraphCount: 0,
  elapsedSeconds: 0,
  isTimerRunning: false,

  isAnalyzing: false,
  guidanceCards: [],
  levelOffer: null,

  isSubmitting: false,
  activeReport: null,
  history: [],

  setTargetBand: (band: TargetBand) => {
    set({ targetBand: band });
    // Note: Workflow rule 3.4 - dynamic band score switching updates system prompt context and active guidance!
  },

  setAssistanceMode: (mode: AssistanceMode) => set({ assistanceMode: mode }),

  setPrompt: (prompt: IELTSTaskPrompt) => set({
    currentPrompt: prompt,
    essayText: '',
    wordCount: 0,
    paragraphCount: 0,
    elapsedSeconds: 0,
    guidanceCards: [],
    levelOffer: null,
    activeReport: null
  }),

  setGeminiApiKey: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ielts_gemini_api_key', key);
    }
    set({ geminiApiKey: key });
  },

  updateEssayText: (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    set({
      essayText: text,
      wordCount: words,
      paragraphCount: paragraphs,
    });
  },

  setTimerRunning: (running: boolean) => set({ isTimerRunning: running }),
  incrementTimer: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  resetTimer: () => set({ elapsedSeconds: 0, isTimerRunning: false }),

  setGuidanceCards: (cards: SocraticGuidanceCard[]) => set({ guidanceCards: cards }),
  addGuidanceCard: (card: SocraticGuidanceCard) => set((state) => ({
    // Prevent duplicate recommendations for same paragraph/title
    guidanceCards: [card, ...state.guidanceCards.filter(c => c.id !== card.id)]
  })),
  clearGuidanceCard: (cardId: string) => set((state) => ({
    guidanceCards: state.guidanceCards.filter(c => c.id !== cardId)
  })),

  setLevelOffer: (offer: LevelOfferAlert | null) => set({ levelOffer: offer }),
  setIsAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),

  setIsSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),
  setActiveReport: (report: SubmissionReport | null) => set((state) => ({
    activeReport: report,
    history: report ? [report, ...state.history] : state.history
  })),

  resetSession: () => set({
    essayText: '',
    wordCount: 0,
    paragraphCount: 0,
    elapsedSeconds: 0,
    isTimerRunning: false,
    guidanceCards: [],
    levelOffer: null,
    activeReport: null
  })
}));
