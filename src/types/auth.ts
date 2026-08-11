import { TargetBand } from './ielts';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  targetBand: TargetBand;
  createdAt: number;
}

export interface AdminAnalyticsKPIs {
  totalSubmissions: number;
  activeSessions: number;
  averageBandAchieved: number;
  aiApiTokenCount: number;
}

export interface BandDistributionItem {
  band: TargetBand;
  count: number;
  percentage: number;
}

export interface StudentSessionActivity {
  id: string;
  studentName: string;
  targetBand: TargetBand;
  taskTitle: string;
  wordCount: number;
  status: 'DRAFTING' | 'SUBMITTED';
  scoreAchieved?: number;
  timestamp: number;
}
