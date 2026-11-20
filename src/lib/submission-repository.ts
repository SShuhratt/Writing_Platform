import { getTursoClient, isTursoConfigured } from '@/lib/turso';
import { getServiceSupabase, isServiceSupabaseConfigured } from '@/lib/supabase';
import { SubmissionReport, TargetBand } from '@/types/ielts';
import { AdminAnalyticsKPIs, BandDistributionItem, StudentSessionActivity } from '@/types/auth';

const MAX_CACHED_REPORTS = 300;
const REPORT_ID_PATTERN = /^[a-zA-Z0-9_-]{4,80}$/;

const globalForReports = globalThis as unknown as {
  __ieltsRecentReportsCache?: Map<string, SubmissionReport>;
  __ieltsReportsTablesReady?: boolean;
};

const recentReportsCache: Map<string, SubmissionReport> =
  globalForReports.__ieltsRecentReportsCache ?? new Map<string, SubmissionReport>();

if (!globalForReports.__ieltsRecentReportsCache) {
  globalForReports.__ieltsRecentReportsCache = recentReportsCache;
}

function getServerSupabase() {
  return getServiceSupabase();
}

/**
 * Validates and strips private account fields from a report payload before caching or public display.
 */
function toPublicReport(raw: unknown): SubmissionReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    !candidate.layer1ExaminerReport ||
    !candidate.layer2AlignmentReport ||
    !candidate.taskPrompt
  ) {
    return null;
  }

  const sanitized: Record<string, unknown> = { ...candidate };
  delete sanitized.user_id;
  delete sanitized.userId;
  delete sanitized.email;
  delete sanitized.userEmail;
  return sanitized as unknown as SubmissionReport;
}

/**
 * Stores a sanitized report in bounded in-memory cache so shared /report/[id] links resolve immediately.
 */
export function cacheReportInMemory(report: SubmissionReport): void {
  const cleanReport = toPublicReport(report);
  if (!cleanReport || !REPORT_ID_PATTERN.test(cleanReport.id)) return;

  if (recentReportsCache.has(cleanReport.id)) {
    recentReportsCache.delete(cleanReport.id);
  } else if (recentReportsCache.size >= MAX_CACHED_REPORTS) {
    const oldestKey = recentReportsCache.keys().next().value;
    if (oldestKey) {
      recentReportsCache.delete(oldestKey);
    }
  }

  recentReportsCache.set(cleanReport.id, cleanReport);
}

/**
 * Initializes tables in Turso LibSQL if they do not exist yet, and applies additive columns.
 */
async function ensureTursoTables(client: any): Promise<void> {
  if (globalForReports.__ieltsReportsTablesReady) return;
  try {
    await client.batch([
      `CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        prompt_id TEXT,
        task_type TEXT NOT NULL,
        content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        time_spent_seconds INTEGER DEFAULT 0,
        target_band TEXT DEFAULT '7.0',
        status TEXT DEFAULT 'COMPLETED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        user_id TEXT,
        overall_band REAL NOT NULL,
        task_response_score REAL NOT NULL,
        coherence_score REAL NOT NULL,
        lexical_score REAL NOT NULL,
        grammar_score REAL NOT NULL,
        ai_tokens_used INTEGER DEFAULT 0,
        examiner_summary TEXT,
        report_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ]);

    const colsRes = await client.execute(`PRAGMA table_info(reports)`);
    const hasAiTokens = colsRes.rows.some((r: any) => String(r.name) === 'ai_tokens_used');
    if (!hasAiTokens) {
      await client.execute(`ALTER TABLE reports ADD COLUMN ai_tokens_used INTEGER DEFAULT 0`);
    }
    globalForReports.__ieltsReportsTablesReady = true;
  } catch (err) {
    console.warn('Could not verify Turso submissions/reports tables:', err);
  }
}

/**
 * Persists a completed essay submission and its Dual-Layer Evaluation report
 * into Turso (LibSQL) or Supabase.
 */
export async function persistSubmissionAndReport(
  report: SubmissionReport,
  userId?: string,
  timeSpentSeconds = 0,
  aiTokensUsed = 0
): Promise<boolean> {
  cacheReportInMemory(report);

  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cleanUserId = userId && !userId.startsWith('user-') && userId !== 'anonymous-student'
    ? userId
    : null;
  const overallBand = report.layer1ExaminerReport.overallBand;
  const ta = report.layer1ExaminerReport.taskResponse.score;
  const cc = report.layer1ExaminerReport.coherenceCohesion.score;
  const lr = report.layer1ExaminerReport.lexicalResource.score;
  const gra = report.layer1ExaminerReport.grammaticalAccuracy.score;
  const summary = report.layer1ExaminerReport.examinerSummary;
  const safeTokens = Math.max(0, Math.round(Number(aiTokensUsed) || 0));
  const serializedReport = JSON.stringify(report);
  let persisted = false;

  // 1. Try Turso LibSQL
  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoTables(turso);

        await turso.batch([
          {
            sql: `INSERT INTO submissions (id, user_id, prompt_id, task_type, content, word_count, time_spent_seconds, target_band, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              submissionId,
              cleanUserId || 'anonymous-student',
              report.taskPrompt.id,
              report.taskPrompt.type,
              report.essayText,
              report.wordCount,
              timeSpentSeconds,
              report.targetBandAtSubmission,
              'EVALUATED',
            ],
          },
          {
            sql: `INSERT INTO reports (id, submission_id, user_id, overall_band, task_response_score, coherence_score, lexical_score, grammar_score, ai_tokens_used, examiner_summary, report_data)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              report.id,
              submissionId,
              cleanUserId || 'anonymous-student',
              overallBand,
              ta,
              cc,
              lr,
              gra,
              safeTokens,
              summary,
              serializedReport,
            ],
          },
        ]);

        persisted = true;
      } catch (err) {
        console.error('Failed to persist submission to Turso:', err);
      }
    }
  }

  // 2. Try Supabase (Service Role)
  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { error: subErr } = await supabase.from('submissions').insert({
          id: submissionId,
          user_id: cleanUserId,
          prompt_id: report.taskPrompt.id,
          task_type: report.taskPrompt.type,
          content: report.essayText,
          word_count: report.wordCount,
          time_spent_seconds: timeSpentSeconds,
          target_band: report.targetBandAtSubmission,
          status: 'EVALUATED',
        });

        if (subErr) {
          console.error('Failed to insert submission into Supabase:', subErr);
        } else {
          const { error: repErr } = await supabase.from('reports').insert({
            id: report.id,
            submission_id: submissionId,
            user_id: cleanUserId,
            overall_band: overallBand,
            task_response_score: ta,
            coherence_score: cc,
            lexical_score: lr,
            grammar_score: gra,
            ai_tokens_used: safeTokens,
            examiner_summary: summary,
            report_data: report,
          });
          if (repErr) {
            console.error('Failed to insert report into Supabase:', repErr);
          } else {
            persisted = true;
          }
        }
      } catch (err) {
        console.error('Failed to persist submission to Supabase:', err);
      }
    }
  }

  return persisted;
}

/**
 * Fetches a single public evaluation report by ID from memory cache, Turso LibSQL, or Supabase.
 */
export async function fetchReportById(id: string): Promise<SubmissionReport | null> {
  const normalizedId = typeof id === 'string' ? id.trim() : '';
  if (!REPORT_ID_PATTERN.test(normalizedId)) {
    return null;
  }

  const cached = recentReportsCache.get(normalizedId);
  if (cached) {
    return cached;
  }

  // 1. Try Turso LibSQL
  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoTables(turso);
        const res = await turso.execute({
          sql: `SELECT report_data FROM reports WHERE id = ? LIMIT 1`,
          args: [normalizedId],
        });

        if (res.rows.length > 0 && res.rows[0]?.report_data) {
          const parsed = JSON.parse(String(res.rows[0].report_data));
          const publicReport = toPublicReport(parsed);
          if (publicReport) {
            cacheReportInMemory(publicReport);
            return publicReport;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch public report from Turso:', err);
      }
    }
  }

  // 2. Try Supabase
  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('report_data')
          .eq('id', normalizedId)
          .maybeSingle();

        if (!error && data?.report_data) {
          const rawPayload =
            typeof data.report_data === 'string'
              ? JSON.parse(data.report_data)
              : data.report_data;
          const publicReport = toPublicReport(rawPayload);
          if (publicReport) {
            cacheReportInMemory(publicReport);
            return publicReport;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch public report from Supabase:', err);
      }
    }
  }

  return null;
}

/**
 * Fetches submission history for an authenticated student across Turso & Supabase.
 */
export async function fetchUserSubmissions(userId: string): Promise<SubmissionReport[]> {
  if (!userId || userId.startsWith('user-')) return [];

  const reportsById = new Map<string, SubmissionReport>();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoTables(turso);
        const res = await turso.execute({
          sql: `SELECT report_data FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
          args: [userId],
        });

        for (const r of res.rows as any[]) {
          try {
            const parsed = JSON.parse(String(r.report_data));
            const clean = toPublicReport(parsed);
            if (clean) {
              reportsById.set(clean.id, clean);
            }
          } catch {
            // Skip malformed row
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user submissions from Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('report_data')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          for (const row of data) {
            try {
              const rawPayload =
                typeof row.report_data === 'string'
                  ? JSON.parse(row.report_data)
                  : row.report_data;
              const clean = toPublicReport(rawPayload);
              if (clean && !reportsById.has(clean.id)) {
                reportsById.set(clean.id, clean);
              }
            } catch {
              // Skip malformed row
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user submissions from Supabase:', err);
      }
    }
  }

  return Array.from(reportsById.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 50);
}

/**
 * Live Admin Analytics: Fetches real counts, 24h active users, AI token telemetry,
 * and band distributions from Turso and/or Supabase without mock fabrication.
 */
export async function fetchLiveAdminAnalytics(): Promise<{
  kpis: AdminAnalyticsKPIs;
  bandDistribution: BandDistributionItem[];
  recentSessions: StudentSessionActivity[];
}> {
  const bands: TargetBand[] = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];
  const emptyDist: BandDistributionItem[] = bands.map((band) => ({
    band,
    count: 0,
    percentage: 0,
  }));

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureTursoTables(turso);

        const [kpiRes, activeRes, distRes, recentRes] = await Promise.all([
          turso.execute(`
            SELECT
              COUNT(*) as total_count,
              COALESCE(AVG(overall_band), 0) as avg_band,
              COALESCE(SUM(COALESCE(ai_tokens_used, 0)), 0) as total_tokens
            FROM reports
          `),
          turso.execute(`
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM reports
            WHERE created_at >= datetime('now', '-1 day')
              AND user_id IS NOT NULL
              AND user_id != 'anonymous-student'
          `),
          turso.execute(`
            SELECT overall_band, COUNT(*) as count
            FROM reports
            GROUP BY overall_band
          `),
          turso.execute(`
            SELECT
              r.id,
              COALESCE(s.user_id, r.user_id) as user_id,
              s.word_count,
              r.overall_band,
              r.report_data,
              s.target_band,
              r.created_at
            FROM reports r
            LEFT JOIN submissions s ON r.submission_id = s.id
            ORDER BY r.created_at DESC
            LIMIT 10
          `),
        ]);

        const total = Number(kpiRes.rows[0]?.total_count || 0);
        const avgBand = total > 0 ? Number(Number(kpiRes.rows[0]?.avg_band || 0).toFixed(1)) : 0;
        const totalTokens = Number(kpiRes.rows[0]?.total_tokens || 0);
        const activeUsers24h = Number(activeRes.rows[0]?.active_users || 0);

        const distMap = new Map<string, number>();
        distRes.rows.forEach((r: any) => {
          distMap.set(String(r.overall_band), Number(r.count));
        });

        const liveDist: BandDistributionItem[] = bands.map((band) => {
          const count = distMap.get(band) || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return { band, count, percentage };
        });

        const liveSessions: StudentSessionActivity[] = recentRes.rows.map((row: any, idx: number) => {
          let taskTitle = 'IELTS Writing Practice Task';
          try {
            const parsed = JSON.parse(String(row.report_data || '{}'));
            if (parsed?.taskPrompt?.title) {
              taskTitle = String(parsed.taskPrompt.title);
            }
          } catch {
            // Keep default label
          }
          return {
            id: String(row.id || `session-${idx}`),
            studentName: String(row.user_id || 'Candidate').replace('user-', 'Student-'),
            targetBand: (row.target_band as TargetBand) || '7.0',
            taskTitle,
            wordCount: Number(row.word_count || 0),
            status: 'SUBMITTED',
            scoreAchieved: Number(row.overall_band || 0),
            timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now() - idx * 60000,
          };
        });

        return {
          kpis: {
            totalSubmissions: total,
            activeSessions: activeUsers24h,
            averageBandAchieved: avgBand,
            aiApiTokenCount: totalTokens,
          },
          bandDistribution: liveDist,
          recentSessions: liveSessions,
        };
      } catch (err) {
        console.warn('Failed to query live analytics from Turso:', err);
      }
    }
  }

  if (isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [{ count: totalCount }, { data: allRows }, { data: recentRows }] = await Promise.all([
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('overall_band, ai_tokens_used, user_id, created_at'),
          supabase
            .from('reports')
            .select('id, user_id, overall_band, report_data, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const rows = allRows || [];
        const total = Number(totalCount ?? rows.length);
        const avgBand =
          rows.length > 0
            ? Number(
                (
                  rows.reduce((sum, r: any) => sum + Number(r.overall_band || 0), 0) / rows.length
                ).toFixed(1)
              )
            : 0;
        const totalTokens = rows.reduce((sum, r: any) => sum + Number(r.ai_tokens_used || 0), 0);
        const activeUsers24h = new Set(
          rows
            .filter((r: any) => r.user_id && r.created_at && String(r.created_at) >= sinceIso)
            .map((r: any) => String(r.user_id))
        ).size;

        const distMap = new Map<string, number>();
        for (const r of rows as any[]) {
          const k = String(r.overall_band);
          distMap.set(k, (distMap.get(k) || 0) + 1);
        }

        const liveDist: BandDistributionItem[] = bands.map((band) => {
          const count = distMap.get(band) || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return { band, count, percentage };
        });

        const liveSessions: StudentSessionActivity[] = (recentRows || []).map((row: any, idx: number) => {
          const payload =
            typeof row.report_data === 'string'
              ? (() => {
                  try {
                    return JSON.parse(row.report_data);
                  } catch {
                    return {};
                  }
                })()
              : row.report_data || {};

          return {
            id: String(row.id || `session-${idx}`),
            studentName: String(row.user_id || 'Candidate'),
            targetBand: (payload?.targetBandAtSubmission as TargetBand) || '7.0',
            taskTitle: String(payload?.taskPrompt?.title || 'IELTS Writing Practice Task'),
            wordCount: Number(payload?.wordCount || 0),
            status: 'SUBMITTED',
            scoreAchieved: Number(row.overall_band || 0),
            timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now() - idx * 60000,
          };
        });

        return {
          kpis: {
            totalSubmissions: total,
            activeSessions: activeUsers24h,
            averageBandAchieved: avgBand,
            aiApiTokenCount: totalTokens,
          },
          bandDistribution: liveDist,
          recentSessions: liveSessions,
        };
      } catch (err) {
        console.warn('Failed to query live analytics from Supabase:', err);
      }
    }
  }

  return {
    kpis: {
      totalSubmissions: 0,
      activeSessions: 0,
      averageBandAchieved: 0,
      aiApiTokenCount: 0,
    },
    bandDistribution: emptyDist,
    recentSessions: [],
  };
}

