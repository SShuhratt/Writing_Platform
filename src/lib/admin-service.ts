import { AdminAnalyticsKPIs, BandDistributionItem, StudentSessionActivity } from '@/types/auth';
import { AuthService } from './auth-service';

export function getEmptyAdminAnalytics(): {
  kpis: AdminAnalyticsKPIs;
  bandDistribution: BandDistributionItem[];
  recentSessions: StudentSessionActivity[];
} {
  return {
    kpis: {
      totalSubmissions: 0,
      activeSessions: 0,
      averageBandAchieved: 0,
      aiApiTokenCount: 0,
    },
    bandDistribution: [],
    recentSessions: [],
  };
}

/**
 * Fetches live analytics from the backend API without falling back to fake demo numbers.
 */
export async function fetchAdminDashboardData(): Promise<{
  kpis: AdminAnalyticsKPIs;
  bandDistribution: BandDistributionItem[];
  recentSessions: StudentSessionActivity[];
  error?: string;
}> {
  const token = AuthService.getAdminToken();

  try {
    const res = await fetch('/api/admin/analytics', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.kpis) {
      return {
        kpis: data.kpis,
        bandDistribution: Array.isArray(data.bandDistribution) ? data.bandDistribution : [],
        recentSessions: Array.isArray(data.recentSessions) ? data.recentSessions : [],
      };
    }

    return {
      ...getEmptyAdminAnalytics(),
      error: data?.error || `Failed to load analytics (HTTP ${res.status}).`,
    };
  } catch {
    return {
      ...getEmptyAdminAnalytics(),
      error: 'Network error while fetching live platform analytics.',
    };
  }
}

export function getAdminAnalyticsKPIs(): AdminAnalyticsKPIs {
  return {
    totalSubmissions: 1428,
    activeSessions: 42,
    averageBandAchieved: 7.2,
    aiApiTokenCount: 184200
  };
}

export function getBandDistributionMetrics(): BandDistributionItem[] {
  return [
    { band: '5.0', count: 45, percentage: 3 },
    { band: '5.5', count: 85, percentage: 6 },
    { band: '6.0', count: 210, percentage: 15 },
    { band: '6.5', count: 340, percentage: 24 },
    { band: '7.0', count: 410, percentage: 29 },
    { band: '7.5', count: 215, percentage: 15 },
    { band: '8.0', count: 90, percentage: 6 },
    { band: '8.5', count: 25, percentage: 1.5 },
    { band: '9.0', count: 8, percentage: 0.5 }
  ];
}

export function getRecentStudentSessions(): StudentSessionActivity[] {
  return [
    {
      id: 'session-101',
      studentName: 'Alex Smith',
      targetBand: '7.5',
      taskTitle: 'Technology in Education',
      wordCount: 278,
      status: 'SUBMITTED',
      scoreAchieved: 7.5,
      timestamp: Date.now() - 1000 * 60 * 8
    },
    {
      id: 'session-102',
      studentName: 'Elena Rostova',
      targetBand: '8.0',
      taskTitle: 'Environmental Responsibility',
      wordCount: 210,
      status: 'DRAFTING',
      timestamp: Date.now() - 1000 * 60 * 14
    },
    {
      id: 'session-103',
      studentName: 'Marcus Vance',
      targetBand: '6.5',
      taskTitle: 'Global Water Usage (1900–2000)',
      wordCount: 165,
      status: 'SUBMITTED',
      scoreAchieved: 6.5,
      timestamp: Date.now() - 1000 * 60 * 25
    },
    {
      id: 'session-104',
      studentName: 'Sophia Lin',
      targetBand: '7.0',
      taskTitle: 'Globalization & Local Traditions',
      wordCount: 262,
      status: 'SUBMITTED',
      scoreAchieved: 7.0,
      timestamp: Date.now() - 1000 * 60 * 42
    },
    {
      id: 'session-105',
      studentName: 'David Miller',
      targetBand: '8.5',
      taskTitle: 'Technology in Education',
      wordCount: 295,
      status: 'SUBMITTED',
      scoreAchieved: 8.5,
      timestamp: Date.now() - 1000 * 60 * 65
    }
  ];
}
