import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TargetBand, AssistanceMode, IELTSTaskPrompt, SocraticGuidanceCard, LevelOfferAlert, SubmissionReport } from '@/types/ielts';
import { User } from '@/types/auth';
import { ActiveCohortAssignmentRef } from '@/types/b2b';
import { PlanCode } from '@/types/billing';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { AuthService } from '@/lib/auth-service';

function computeEssayMetrics(text: string): { wordCount: number; paragraphCount: number } {
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const paragraphCount = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  return { wordCount, paragraphCount };
}

export type AuthModalMode = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | null;

interface WritingState {
  // Auth state
  currentUser: User | null;
  authModalMode: AuthModalMode;

  // Config state
  targetBand: TargetBand;
  assistanceMode: AssistanceMode;
  currentPrompt: IELTSTaskPrompt;

  // Active Writing State
  essayText: string;
  draftsByPromptId: Record<string, string>;
  wordCount: number;
  paragraphCount: number;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  activeAssignment: ActiveCohortAssignmentRef | null;

  // Guidance State
  isAnalyzing: boolean;
  guidanceCards: SocraticGuidanceCard[];
  levelOffer: LevelOfferAlert | null;

  // Evaluation & History
  isSubmitting: boolean;
  activeReport: SubmissionReport | null;
  history: SubmissionReport[];

  // Daily Quota & Plan State
  activePlanCode: PlanCode | 'STAFF';
  dailyEvaluationLimit: number;
  planExpiresAt: number | null;
  isUpgradeModalOpen: boolean;
  dailyEvaluationsUsed: number;
  dailyQuotaDate: string;
  getRemainingDailyEvaluations: () => number;
  recordEvaluationUsed: () => void;
  setUpgradeModalOpen: (open: boolean) => void;
  applyBillingSnapshot: (snapshot: {
    planCode: PlanCode | 'STAFF';
    limit: number;
    used: number;
    expiresAt?: number | null;
  }) => void;
  syncBillingStatus: () => Promise<void>;

  // Theme state
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  logout: () => void;

  setTargetBand: (band: TargetBand) => void;
  setAssistanceMode: (mode: AssistanceMode) => void;
  setPrompt: (prompt: IELTSTaskPrompt) => void;
  setActiveAssignment: (assignment: ActiveCohortAssignmentRef | null) => void;
  startCohortAssignment: (assignmentRef: ActiveCohortAssignmentRef, prompt: IELTSTaskPrompt) => void;

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
  syncHistoryFromServer: () => Promise<void>;
  resetSession: () => void;
}

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      authModalMode: null,

      targetBand: '7.0',
      assistanceMode: 'ACTIVE_ASSISTANT',
      currentPrompt: OFFICIAL_PROMPTS_DATABASE[0],

      essayText: '',
      draftsByPromptId: {},
      wordCount: 0,
      paragraphCount: 0,
      elapsedSeconds: 0,
      isTimerRunning: false,
      activeAssignment: null,

      isAnalyzing: false,
      guidanceCards: [],
      levelOffer: null,

      isSubmitting: false,
      activeReport: null,
      history: [],

      activePlanCode: 'FREE',
      dailyEvaluationLimit: 2,
      planExpiresAt: null,
      isUpgradeModalOpen: false,
      dailyEvaluationsUsed: 0,
      dailyQuotaDate: new Date().toISOString().slice(0, 10),

      getRemainingDailyEvaluations: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { dailyQuotaDate, dailyEvaluationsUsed, dailyEvaluationLimit, currentUser } = get();
        if (currentUser?.role === 'admin' || currentUser?.role === 'teacher') return 999;
        const limit = Math.max(2, dailyEvaluationLimit || 2);
        if (dailyQuotaDate !== today) {
          set({ dailyEvaluationsUsed: 0, dailyQuotaDate: today });
          return limit;
        }
        return Math.max(0, limit - dailyEvaluationsUsed);
      },

      recordEvaluationUsed: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { dailyQuotaDate, dailyEvaluationsUsed } = get();
        if (dailyQuotaDate !== today) {
          set({ dailyEvaluationsUsed: 1, dailyQuotaDate: today });
        } else {
          set({ dailyEvaluationsUsed: dailyEvaluationsUsed + 1 });
        }
      },

      setUpgradeModalOpen: (open: boolean) => set({ isUpgradeModalOpen: open }),

      applyBillingSnapshot: (snapshot) => {
        const today = new Date().toISOString().slice(0, 10);
        set({
          activePlanCode: snapshot.planCode,
          dailyEvaluationLimit: snapshot.limit,
          dailyEvaluationsUsed: snapshot.used,
          dailyQuotaDate: today,
          planExpiresAt: snapshot.expiresAt ?? null,
        });
      },

      syncBillingStatus: async () => {
        if (typeof window === 'undefined') return;
        try {
          const token = AuthService.getSessionToken();
          const res = await fetch('/api/billing/status', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.status === 401 && get().currentUser) {
            AuthService.clearUser();
            set({ currentUser: null });
            return;
          }
          if (!res.ok) return;
          const data = await res.json();
          if (data?.success && data?.quota) {
            get().applyBillingSnapshot({
              planCode: data.quota.planCode,
              limit: data.quota.limit,
              used: data.quota.used,
              expiresAt: data.activeEntitlement?.expiresAt ?? null,
            });
          }
        } catch (err) {
          console.warn('Billing status sync skipped:', err);
        }
      },

      theme: 'dark',

      setTheme: (theme: 'dark' | 'light') => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ielts_theme', theme);
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(theme);
        }
        set({ theme });
      },

      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(nextTheme);
      },

      setCurrentUser: (user: User | null) =>
        set((state) => {
          const isAccountSwitch =
            Boolean(state.currentUser?.id) && Boolean(user?.id) && state.currentUser?.id !== user?.id;
          return {
            currentUser: user,
            targetBand: user?.targetBand || state.targetBand,
            ...(isAccountSwitch
              ? {
                  essayText: '',
                  draftsByPromptId: {},
                  wordCount: 0,
                  paragraphCount: 0,
                  elapsedSeconds: 0,
                  isTimerRunning: false,
                  guidanceCards: [],
                  levelOffer: null,
                  activeReport: null,
                  history: [],
                  activeAssignment: null,
                }
              : {}),
          };
        }),

      setAuthModalMode: (mode: AuthModalMode) => set({ authModalMode: mode }),

      logout: () => {
        AuthService.clearUser();
        set({
          currentUser: null,
          authModalMode: null,
          activeAssignment: null,
          activePlanCode: 'FREE',
          dailyEvaluationLimit: 2,
          planExpiresAt: null,
          dailyEvaluationsUsed: 0,
          essayText: '',
          draftsByPromptId: {},
          wordCount: 0,
          paragraphCount: 0,
          elapsedSeconds: 0,
          isTimerRunning: false,
          guidanceCards: [],
          levelOffer: null,
          activeReport: null,
          history: [],
        });
      },

      setTargetBand: (band: TargetBand) => set({ targetBand: band }),
      setAssistanceMode: (mode: AssistanceMode) => set({ assistanceMode: mode }),

      setPrompt: (prompt: IELTSTaskPrompt) =>
        set((state) => {
          const nextDrafts = {
            ...state.draftsByPromptId,
            [state.currentPrompt.id]: state.essayText,
          };
          const restoredText = nextDrafts[prompt.id] || '';
          const metrics = computeEssayMetrics(restoredText);
          return {
            currentPrompt: prompt,
            draftsByPromptId: nextDrafts,
            essayText: restoredText,
            wordCount: metrics.wordCount,
            paragraphCount: metrics.paragraphCount,
            elapsedSeconds: 0,
            isTimerRunning: false,
            guidanceCards: [],
            levelOffer: null,
            activeReport: null,
            activeAssignment: null,
          };
        }),

      setActiveAssignment: (assignment: ActiveCohortAssignmentRef | null) =>
        set({ activeAssignment: assignment }),

      startCohortAssignment: (assignmentRef: ActiveCohortAssignmentRef, prompt: IELTSTaskPrompt) =>
        set((state) => {
          const nextDrafts = {
            ...state.draftsByPromptId,
            [state.currentPrompt.id]: state.essayText,
          };
          const restoredText = nextDrafts[prompt.id] || '';
          const metrics = computeEssayMetrics(restoredText);
          return {
            currentPrompt: prompt,
            activeAssignment: assignmentRef,
            draftsByPromptId: nextDrafts,
            essayText: restoredText,
            wordCount: metrics.wordCount,
            paragraphCount: metrics.paragraphCount,
            elapsedSeconds: 0,
            isTimerRunning: false,
            guidanceCards: [],
            levelOffer: null,
            activeReport: null,
          };
        }),

      updateEssayText: (text: string) => {
        const metrics = computeEssayMetrics(text);
        set((state) => ({
          essayText: text,
          draftsByPromptId: {
            ...state.draftsByPromptId,
            [state.currentPrompt.id]: text,
          },
          wordCount: metrics.wordCount,
          paragraphCount: metrics.paragraphCount,
        }));
      },

      setTimerRunning: (running: boolean) => set({ isTimerRunning: running }),
      incrementTimer: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
      resetTimer: () => set({ elapsedSeconds: 0, isTimerRunning: false }),

      setGuidanceCards: (cards: SocraticGuidanceCard[]) => set({ guidanceCards: cards }),
      addGuidanceCard: (card: SocraticGuidanceCard) => set((state) => ({
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
        history: report
          ? [report, ...state.history.filter((item) => item.id !== report.id)]
          : state.history
      })),

      syncHistoryFromServer: async () => {
        if (typeof window === 'undefined') return;
        const token = AuthService.getSessionToken();
        if (!token) return;
        try {
          const res = await fetch('/api/submissions', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data?.success && Array.isArray(data.reports)) {
            set({ history: data.reports });
          }
        } catch (err) {
          console.warn('History sync skipped:', err);
        }
      },

      resetSession: () =>
        set((state) => ({
          essayText: '',
          draftsByPromptId: {
            ...state.draftsByPromptId,
            [state.currentPrompt.id]: '',
          },
          wordCount: 0,
          paragraphCount: 0,
          elapsedSeconds: 0,
          isTimerRunning: false,
          guidanceCards: [],
          levelOffer: null,
          activeReport: null,
          activeAssignment: null,
        }))
    }),
    {
      name: 'ielts_writing_workspace_draft',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        essayText: state.essayText,
        draftsByPromptId: state.draftsByPromptId,
        wordCount: state.wordCount,
        paragraphCount: state.paragraphCount,
        elapsedSeconds: state.elapsedSeconds,
        currentPrompt: state.currentPrompt,
        activeAssignment: state.activeAssignment,
        targetBand: state.targetBand,
        assistanceMode: state.assistanceMode,
        history: state.history,
        activePlanCode: state.activePlanCode,
        dailyEvaluationLimit: state.dailyEvaluationLimit,
        planExpiresAt: state.planExpiresAt,
        dailyEvaluationsUsed: state.dailyEvaluationsUsed,
        dailyQuotaDate: state.dailyQuotaDate,
        theme: state.theme,
      }),
    }
  )
);
