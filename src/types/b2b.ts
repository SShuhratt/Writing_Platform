import { IELTSTaskPrompt, SubmissionReport, TargetBand, TaskType } from './ielts';

export interface Cohort {
  id: string;
  name: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  joinCode: string;
  targetBand: TargetBand;
  createdAt: number;
}

export interface CohortWithStats extends Cohort {
  memberCount: number;
  assignmentCount: number;
  submissionCount: number;
  averageBand: number | null;
}

export interface CohortMembership {
  id: string;
  cohortId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  joinedAt: number;
}

export interface CohortAssignment {
  id: string;
  cohortId: string;
  prompt: IELTSTaskPrompt;
  teacherNotes?: string;
  dueDate?: string;
  assignedBy: string;
  createdAt: number;
}

export interface CohortSubmissionItem {
  id: string;
  reportId: string;
  cohortId: string;
  assignmentId?: string;
  studentId: string;
  studentName: string;
  promptId: string;
  promptTitle: string;
  taskType: TaskType;
  wordCount: number;
  overallBand: number;
  taskResponseScore: number;
  coherenceScore: number;
  lexicalScore: number;
  grammarScore: number;
  teacherFeedback?: string;
  reviewedAt?: number;
  submittedAt: number;
}

export interface StudentCohortBundle {
  cohort: Cohort;
  assignments: CohortAssignment[];
  submissions: CohortSubmissionItem[];
}

export interface CohortDetailBundle {
  cohort: Cohort;
  members: CohortMembership[];
  assignments: CohortAssignment[];
  submissions: CohortSubmissionItem[];
  sampleReports?: Record<string, SubmissionReport>;
}

export interface ActiveCohortAssignmentRef {
  cohortId: string;
  assignmentId: string;
  cohortName: string;
  promptId: string;
}

