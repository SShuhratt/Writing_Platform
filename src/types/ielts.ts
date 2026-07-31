export type TargetBand = '5.0' | '5.5' | '6.0' | '6.5' | '7.0' | '7.5' | '8.0' | '8.5' | '9.0';

export type AssistanceMode = 'ACTIVE_ASSISTANT' | 'FOCUS_EXAM';

export type TaskType = 'TASK_1_ACADEMIC' | 'TASK_1_GENERAL' | 'TASK_2_ESSAY';

export interface IELTSTaskPrompt {
  id: string;
  title: string;
  type: TaskType;
  category: string;
  questionText: string;
  chartDescription?: string;
  minWordCount: number;
  recommendedTimeMinutes: number;
}

export type GuidanceCategory = 'LEXICAL_RESOURCE' | 'COHERENCE_COHESION' | 'TASK_RESPONSE';

export interface SocraticGuidanceCard {
  id: string;
  category: GuidanceCategory;
  paragraphIndex: number;
  highlightSnippet?: string;
  title: string;
  socraticPrompt: string; // Pedagogical question/guidance without direct rewritten sentences!
  targetBandContext: TargetBand;
  createdAt: number;
}

export interface LevelOfferAlert {
  type: 'UPWARD' | 'DOWNWARD';
  suggestedBand: TargetBand;
  reason: string;
}

export interface CriteriaEvaluation {
  score: number; // 1.0 to 9.0
  commentary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
}

export interface ObjectiveExaminerReport {
  overallBand: number; // Rounded to nearest 0.5
  taskResponse: CriteriaEvaluation;
  coherenceCohesion: CriteriaEvaluation;
  lexicalResource: CriteriaEvaluation;
  grammaticalAccuracy: CriteriaEvaluation;
  examinerSummary: string;
}

export type TargetAlignmentStatus = 'TARGET_ACHIEVED' | 'TARGET_NOT_MET' | 'EXCEEDED_TARGET';

export interface ParagraphAlignmentAudit {
  paragraphNumber: number;
  textSnippet: string;
  status: 'MET' | 'BELOW' | 'EXCEEDED';
  analysis: string;
}

export interface TargetAlignmentReport {
  targetStatus: TargetAlignmentStatus;
  selectedTargetBand: TargetBand;
  achievedBand: number;
  paragraphAudits: ParagraphAlignmentAudit[];
  gapAnalysis: string;
  actionableRoadmap: string[];
}

export interface SubmissionReport {
  id: string;
  timestamp: number;
  taskPrompt: IELTSTaskPrompt;
  essayText: string;
  wordCount: number;
  targetBandAtSubmission: TargetBand;
  modeAtSubmission: AssistanceMode;
  layer1ExaminerReport: ObjectiveExaminerReport;
  layer2AlignmentReport: TargetAlignmentReport;
}
