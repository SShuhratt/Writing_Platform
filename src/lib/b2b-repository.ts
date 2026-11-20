import crypto from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/password-hash';
import { getTursoClient, isTursoConfigured } from '@/lib/turso';
import { getServiceSupabase, isServiceSupabaseConfigured, isServiceSupabaseConfigured as isSupabaseConfigured } from '@/lib/supabase';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { sanitizeTaskPrompt, sanitizeTargetBand } from '@/lib/security-sanitize';
import { cacheReportInMemory } from '@/lib/submission-repository';
import { generateMockSubmissionEvaluation } from '@/lib/ai-service';
import { IELTSTaskPrompt, SubmissionReport, TargetBand, TaskType } from '@/types/ielts';
import { User } from '@/types/auth';
import {
  Cohort,
  CohortAssignment,
  CohortDetailBundle,
  CohortMembership,
  CohortSubmissionItem,
  CohortWithStats,
  StudentCohortBundle,
} from '@/types/b2b';

interface TeacherAccountRecord {
  id: string;
  email: string;
  fullName: string;
  schoolName: string;
  passwordHash: string;
  createdAt: number;
}

interface B2BMemoryStore {
  teachers: Map<string, TeacherAccountRecord>;
  cohorts: Map<string, Cohort>;
  memberships: Map<string, CohortMembership>;
  assignments: Map<string, CohortAssignment>;
  submissions: Map<string, CohortSubmissionItem>;
}

const globalForB2B = globalThis as unknown as {
  __ieltsB2BMemoryStore?: B2BMemoryStore;
};

function getMemoryStore(): B2BMemoryStore {
  if (!globalForB2B.__ieltsB2BMemoryStore) {
    globalForB2B.__ieltsB2BMemoryStore = {
      teachers: new Map(),
      cohorts: new Map(),
      memberships: new Map(),
      assignments: new Map(),
      submissions: new Map(),
    };
  }
  return globalForB2B.__ieltsB2BMemoryStore;
}

function getServerSupabase() {
  return getServiceSupabase();
}

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen).trim();
}

const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createJoinCodeCandidate(): string {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += JOIN_CODE_CHARS[bytes[i] % JOIN_CODE_CHARS.length];
  }
  return code;
}

/**
 * Ensures B2B tables exist inside Turso LibSQL when Turso is configured.
 */
async function ensureB2BTables(client: any): Promise<void> {
  try {
    await client.batch([
      `CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        school_name TEXT NOT NULL DEFAULT 'Partner Academy',
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cohorts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school_name TEXT NOT NULL DEFAULT 'Partner Academy',
        teacher_id TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        join_code TEXT UNIQUE NOT NULL,
        target_band TEXT NOT NULL DEFAULT '7.0',
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cohort_memberships (
        id TEXT PRIMARY KEY,
        cohort_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT,
        joined_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cohort_assignments (
        id TEXT PRIMARY KEY,
        cohort_id TEXT NOT NULL,
        prompt_id TEXT NOT NULL,
        prompt_data TEXT NOT NULL,
        teacher_notes TEXT,
        due_date TEXT,
        assigned_by TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cohort_submissions (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL,
        cohort_id TEXT NOT NULL,
        assignment_id TEXT,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        prompt_id TEXT NOT NULL,
        prompt_title TEXT NOT NULL,
        task_type TEXT NOT NULL,
        word_count INTEGER NOT NULL DEFAULT 0,
        overall_band REAL NOT NULL,
        ta_score REAL NOT NULL,
        cc_score REAL NOT NULL,
        lr_score REAL NOT NULL,
        gra_score REAL NOT NULL,
        teacher_feedback TEXT,
        reviewed_at INTEGER,
        submitted_at INTEGER NOT NULL
      )`,
    ]);
  } catch (err) {
    console.warn('Could not initialize B2B Turso tables:', err);
  }
}

function rowToCohort(row: any): Cohort {
  return {
    id: String(row.id),
    name: String(row.name),
    schoolName: String(row.school_name || 'Partner Academy'),
    teacherId: String(row.teacher_id),
    teacherName: String(row.teacher_name),
    joinCode: String(row.join_code).toUpperCase(),
    targetBand: sanitizeTargetBand(row.target_band),
    createdAt: Number(row.created_at || Date.now()),
  };
}

function rowToMembership(row: any): CohortMembership {
  return {
    id: String(row.id),
    cohortId: String(row.cohort_id),
    studentId: String(row.student_id),
    studentName: String(row.student_name),
    studentEmail: row.student_email ? String(row.student_email) : undefined,
    joinedAt: Number(row.joined_at || Date.now()),
  };
}

function rowToAssignment(row: any): CohortAssignment | null {
  try {
    const rawPrompt =
      typeof row.prompt_data === 'string' ? JSON.parse(row.prompt_data) : row.prompt_data;
    return {
      id: String(row.id),
      cohortId: String(row.cohort_id),
      prompt: sanitizeTaskPrompt(rawPrompt),
      teacherNotes: row.teacher_notes ? String(row.teacher_notes) : undefined,
      dueDate: row.due_date ? String(row.due_date) : undefined,
      assignedBy: String(row.assigned_by),
      createdAt: Number(row.created_at || Date.now()),
    };
  } catch {
    return null;
  }
}

function rowToCohortSubmission(row: any): CohortSubmissionItem {
  return {
    id: String(row.id),
    reportId: String(row.report_id),
    cohortId: String(row.cohort_id),
    assignmentId: row.assignment_id ? String(row.assignment_id) : undefined,
    studentId: String(row.student_id),
    studentName: String(row.student_name),
    promptId: String(row.prompt_id),
    promptTitle: String(row.prompt_title),
    taskType: (row.task_type as TaskType) || 'TASK_2_ESSAY',
    wordCount: Number(row.word_count || 0),
    overallBand: Number(row.overall_band || 6.5),
    taskResponseScore: Number(row.ta_score || 6.5),
    coherenceScore: Number(row.cc_score || 6.5),
    lexicalScore: Number(row.lr_score || 6.5),
    grammarScore: Number(row.gra_score || 6.5),
    teacherFeedback: row.teacher_feedback ? String(row.teacher_feedback) : undefined,
    reviewedAt: row.reviewed_at ? Number(row.reviewed_at) : undefined,
    submittedAt: Number(row.submitted_at || Date.now()),
  };
}

/**
 * Registers or authenticates a B2B School Teacher using scrypt salted password hashing.
 */
export async function authenticateOrRegisterTeacher(params: {
  mode: 'LOGIN' | 'REGISTER';
  email: string;
  password: string;
  fullName?: string;
  schoolName?: string;
  accessCode?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const email = sanitizeText(params.email, 120).toLowerCase();
  const password = typeof params.password === 'string' ? params.password : '';
  const fullName = sanitizeText(params.fullName, 80);
  const schoolName = sanitizeText(params.schoolName, 100) || 'Partner Language School';

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid institutional or personal email address.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const store = getMemoryStore();
  let existing = store.teachers.get(email) || null;

  if (!existing && isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM teachers WHERE email = ? LIMIT 1`,
          args: [email],
        });
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          existing = {
            id: String(row.id),
            email: String(row.email),
            fullName: String(row.full_name),
            schoolName: String(row.school_name || 'Partner Language School'),
            passwordHash: String(row.password_hash),
            createdAt: Number(row.created_at || Date.now()),
          };
          store.teachers.set(email, existing);
        }
      } catch (err) {
        console.warn('Teacher lookup in Turso failed, falling back:', err);
      }
    }
  }

  if (!existing && isServiceSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', email)
          .limit(1)
          .maybeSingle();
        if (data) {
          existing = {
            id: String(data.id),
            email: String(data.email),
            fullName: String(data.full_name),
            schoolName: String(data.school_name || 'Partner Language School'),
            passwordHash: String(data.password_hash),
            createdAt: Number(data.created_at || Date.now()),
          };
          store.teachers.set(email, existing);
        }
      } catch (err) {
        console.warn('Teacher lookup in Supabase failed:', err);
      }
    }
  }

  if (params.mode === 'REGISTER') {
    const requiredCode = process.env.TEACHER_ACCESS_CODE;
    if (requiredCode && params.accessCode?.trim() !== requiredCode.trim()) {
      return {
        success: false,
        error: 'Invalid School Access Code. Contact your IELTS Mentor administrator.',
      };
    }

    if (existing) {
      return {
        success: false,
        error: 'An instructor account with this email already exists. Please sign in instead.',
      };
    }

    const teacherId = `teacher-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 12)}`;
    const record: TeacherAccountRecord = {
      id: teacherId,
      email,
      fullName: fullName || email.split('@')[0],
      schoolName,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
    };

    store.teachers.set(email, record);

    if (isTursoConfigured()) {
      const turso = getTursoClient();
      if (turso) {
        try {
          await ensureB2BTables(turso);
          await turso.execute({
            sql: `INSERT INTO teachers (id, email, full_name, school_name, password_hash, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              record.id,
              record.email,
              record.fullName,
              record.schoolName,
              record.passwordHash,
              record.createdAt,
            ],
          });
        } catch (err) {
          console.warn('Could not persist teacher account to Turso:', err);
        }
      }
    }

    if (isServiceSupabaseConfigured()) {
      const supabase = getServerSupabase();
      if (supabase) {
        try {
          await supabase.from('teachers').upsert({
            id: record.id,
            email: record.email,
            full_name: record.fullName,
            school_name: record.schoolName,
            password_hash: record.passwordHash,
            created_at: record.createdAt,
          });
        } catch (err) {
          console.warn('Could not persist teacher account to Supabase:', err);
        }
      }
    }

    return {
      success: true,
      user: {
        id: record.id,
        username: email.split('@')[0],
        email: record.email,
        fullName: record.fullName,
        schoolName: record.schoolName,
        role: 'teacher',
        targetBand: '7.5',
        createdAt: record.createdAt,
      },
    };
  }

  // LOGIN branch
  if (!existing || !verifyPassword(password, existing.passwordHash)) {
    return {
      success: false,
      error: 'Invalid teacher email or password. Register a new instructor account if this is your first visit.',
    };
  }

  return {
    success: true,
    user: {
      id: existing.id,
      username: existing.email.split('@')[0],
      email: existing.email,
      fullName: existing.fullName,
      schoolName: existing.schoolName,
      role: 'teacher',
      targetBand: '7.5',
      createdAt: existing.createdAt,
    },
  };
}

/**
 * Persists and returns a newly created student cohort with a unique 6-character invite code.
 */
export async function createCohort(params: {
  name: string;
  schoolName?: string;
  targetBand?: TargetBand;
  teacherId: string;
  teacherName: string;
}): Promise<Cohort> {
  const store = getMemoryStore();
  const cleanName = sanitizeText(params.name, 90) || 'IELTS Writing Cohort';
  const cleanSchool = sanitizeText(params.schoolName, 90) || 'Partner Academy';
  const cleanTeacherName = sanitizeText(params.teacherName, 80) || 'Instructor';
  const targetBand = sanitizeTargetBand(params.targetBand || '7.0');

  let joinCode = createJoinCodeCandidate();
  const existingCodes = new Set(Array.from(store.cohorts.values()).map((c) => c.joinCode));
  while (existingCodes.has(joinCode)) {
    joinCode = createJoinCodeCandidate();
  }

  const cohort: Cohort = {
    id: `cohort-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    name: cleanName,
    schoolName: cleanSchool,
    teacherId: params.teacherId,
    teacherName: cleanTeacherName,
    joinCode,
    targetBand,
    createdAt: Date.now(),
  };

  store.cohorts.set(cohort.id, cohort);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        await turso.execute({
          sql: `INSERT INTO cohorts (id, name, school_name, teacher_id, teacher_name, join_code, target_band, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            cohort.id,
            cohort.name,
            cohort.schoolName,
            cohort.teacherId,
            cohort.teacherName,
            cohort.joinCode,
            cohort.targetBand,
            cohort.createdAt,
          ],
        });
      } catch (err) {
        console.warn('Failed to persist cohort to Turso:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('cohorts').insert({
          id: cohort.id,
          name: cohort.name,
          school_name: cohort.schoolName,
          teacher_id: cohort.teacherId,
          teacher_name: cohort.teacherName,
          join_code: cohort.joinCode,
          target_band: cohort.targetBand,
          created_at: cohort.createdAt,
        });
      } catch (err) {
        console.warn('Failed to persist cohort to Supabase:', err);
      }
    }
  }

  return cohort;
}

/**
 * Hydrates in-memory cohorts/details from Turso or Supabase when configured so restarts stay warm.
 */
async function syncCohortsFromDb(filterTeacherId?: string): Promise<void> {
  const store = getMemoryStore();

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        const cohortRes = filterTeacherId
          ? await turso.execute({
              sql: `SELECT * FROM cohorts WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 50`,
              args: [filterTeacherId],
            })
          : await turso.execute(`SELECT * FROM cohorts ORDER BY created_at DESC LIMIT 100`);

        for (const row of cohortRes.rows) {
          const cohort = rowToCohort(row);
          store.cohorts.set(cohort.id, cohort);
        }

        const cohortIds = cohortRes.rows.map((r: any) => String(r.id));
        if (cohortIds.length > 0) {
          const placeholders = cohortIds.map(() => '?').join(', ');
          const [memRes, assignRes, subRes] = await Promise.all([
            turso.execute({
              sql: `SELECT * FROM cohort_memberships WHERE cohort_id IN (${placeholders})`,
              args: cohortIds,
            }),
            turso.execute({
              sql: `SELECT * FROM cohort_assignments WHERE cohort_id IN (${placeholders})`,
              args: cohortIds,
            }),
            turso.execute({
              sql: `SELECT * FROM cohort_submissions WHERE cohort_id IN (${placeholders})`,
              args: cohortIds,
            }),
          ]);

          for (const row of memRes.rows) {
            const m = rowToMembership(row);
            store.memberships.set(m.id, m);
          }
          for (const row of assignRes.rows) {
            const a = rowToAssignment(row);
            if (a) store.assignments.set(a.id, a);
          }
          for (const row of subRes.rows) {
            const s = rowToCohortSubmission(row);
            store.submissions.set(`${s.cohortId}:${s.reportId}`, s);
          }
        }
        return;
      } catch (err) {
        console.warn('Turso syncCohortsFromDb fallback to memory:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        let query = supabase.from('cohorts').select('*').order('created_at', { ascending: false }).limit(50);
        if (filterTeacherId) {
          query = query.eq('teacher_id', filterTeacherId);
        }
        const { data: cohortRows } = await query;
        if (Array.isArray(cohortRows) && cohortRows.length > 0) {
          const ids = cohortRows.map((r: any) => {
            const c = rowToCohort(r);
            store.cohorts.set(c.id, c);
            return c.id;
          });
          const [memRes, assignRes, subRes] = await Promise.all([
            supabase.from('cohort_memberships').select('*').in('cohort_id', ids),
            supabase.from('cohort_assignments').select('*').in('cohort_id', ids),
            supabase.from('cohort_submissions').select('*').in('cohort_id', ids),
          ]);
          for (const row of memRes.data || []) {
            const m = rowToMembership(row);
            store.memberships.set(m.id, m);
          }
          for (const row of assignRes.data || []) {
            const a = rowToAssignment(row);
            if (a) store.assignments.set(a.id, a);
          }
          for (const row of subRes.data || []) {
            const s = rowToCohortSubmission(row);
            store.submissions.set(`${s.cohortId}:${s.reportId}`, s);
          }
        }
      } catch (err) {
        console.warn('Supabase syncCohortsFromDb fallback to memory:', err);
      }
    }
  }
}

/**
 * Lists all cohorts managed by a teacher (or all cohorts for platform admins) with computed KPIs.
 */
export async function listTeacherCohorts(
  teacherId: string,
  isAdmin = false
): Promise<CohortWithStats[]> {
  await syncCohortsFromDb(isAdmin ? undefined : teacherId);
  const store = getMemoryStore();

  const visibleCohorts = Array.from(store.cohorts.values())
    .filter((c) => isAdmin || c.teacherId === teacherId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const allMembers = Array.from(store.memberships.values());
  const allAssignments = Array.from(store.assignments.values());
  const allSubmissions = Array.from(store.submissions.values());

  return visibleCohorts.map((cohort) => {
    const members = allMembers.filter((m) => m.cohortId === cohort.id);
    const assignments = allAssignments.filter((a) => a.cohortId === cohort.id);
    const subs = allSubmissions.filter((s) => s.cohortId === cohort.id);
    const avg =
      subs.length > 0
        ? Number((subs.reduce((acc, s) => acc + s.overallBand, 0) / subs.length).toFixed(1))
        : null;

    return {
      ...cohort,
      memberCount: members.length,
      assignmentCount: assignments.length,
      submissionCount: subs.length,
      averageBand: avg,
    };
  });
}

async function findCohortById(cohortId: string): Promise<Cohort | null> {
  const store = getMemoryStore();
  const cached = store.cohorts.get(cohortId);
  if (cached) return cached;

  await syncCohortsFromDb();
  return store.cohorts.get(cohortId) || null;
}

/**
 * Returns full members, assignments, and student submissions for a teacher's cohort.
 */
export async function getCohortDetail(
  cohortId: string,
  requesterId: string,
  isAdmin = false
): Promise<{ status: 'OK'; detail: CohortDetailBundle } | { status: 'NOT_FOUND' } | { status: 'FORBIDDEN' }> {
  const cohort = await findCohortById(cohortId);
  if (!cohort) return { status: 'NOT_FOUND' };
  if (!isAdmin && cohort.teacherId !== requesterId) {
    return { status: 'FORBIDDEN' };
  }

  await syncCohortsFromDb(cohort.teacherId);
  const store = getMemoryStore();

  const members = Array.from(store.memberships.values())
    .filter((m) => m.cohortId === cohort.id)
    .sort((a, b) => b.joinedAt - a.joinedAt);

  const assignments = Array.from(store.assignments.values())
    .filter((a) => a.cohortId === cohort.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const submissions = Array.from(store.submissions.values())
    .filter((s) => s.cohortId === cohort.id)
    .sort((a, b) => b.submittedAt - a.submittedAt);

  return {
    status: 'OK',
    detail: { cohort, members, assignments, submissions },
  };
}

/**
 * Joins a student into a cohort by 6-character invite code (idempotent for existing members).
 */
export async function joinCohortByCode(params: {
  joinCode: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
}): Promise<{
  success: boolean;
  error?: string;
  cohort?: Cohort;
  membership?: CohortMembership;
  assignments?: CohortAssignment[];
}> {
  const cleanCode = sanitizeText(params.joinCode, 12).toUpperCase();
  const cleanStudentId = sanitizeText(params.studentId, 100);
  const cleanStudentName = sanitizeText(params.studentName, 80) || 'Student Candidate';
  const cleanEmail = params.studentEmail ? sanitizeText(params.studentEmail, 120).toLowerCase() : undefined;

  if (!cleanCode || !cleanStudentId) {
    return { success: false, error: 'Class join code and student session are required.' };
  }

  const store = getMemoryStore();
  let cohort = Array.from(store.cohorts.values()).find((c) => c.joinCode === cleanCode) || null;

  if (!cohort && isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        const res = await turso.execute({
          sql: `SELECT * FROM cohorts WHERE join_code = ? LIMIT 1`,
          args: [cleanCode],
        });
        if (res.rows.length > 0) {
          cohort = rowToCohort(res.rows[0]);
          store.cohorts.set(cohort.id, cohort);
        }
      } catch (err) {
        console.warn('Turso cohort lookup by join code failed:', err);
      }
    }
  }

  if (!cohort && isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('cohorts')
          .select('*')
          .eq('join_code', cleanCode)
          .maybeSingle();
        if (data) {
          cohort = rowToCohort(data);
          store.cohorts.set(cohort.id, cohort);
        }
      } catch (err) {
        console.warn('Supabase cohort lookup by join code failed:', err);
      }
    }
  }

  if (!cohort) {
    return { success: false, error: `No classroom found for invite code "${cleanCode}".` };
  }

  await syncCohortsFromDb(cohort.teacherId);

  let membership = Array.from(store.memberships.values()).find(
    (m) =>
      m.cohortId === cohort!.id &&
      (m.studentId === cleanStudentId ||
        (cleanEmail && m.studentEmail && m.studentEmail.toLowerCase() === cleanEmail))
  );

  if (!membership) {
    membership = {
      id: `mem-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      cohortId: cohort.id,
      studentId: cleanStudentId,
      studentName: cleanStudentName,
      studentEmail: cleanEmail,
      joinedAt: Date.now(),
    };
    store.memberships.set(membership.id, membership);

    if (isTursoConfigured()) {
      const turso = getTursoClient();
      if (turso) {
        try {
          await ensureB2BTables(turso);
          await turso.execute({
            sql: `INSERT INTO cohort_memberships (id, cohort_id, student_id, student_name, student_email, joined_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              membership.id,
              membership.cohortId,
              membership.studentId,
              membership.studentName,
              membership.studentEmail || null,
              membership.joinedAt,
            ],
          });
        } catch (err) {
          console.warn('Failed to persist membership to Turso:', err);
        }
      }
    }

    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();
      if (supabase) {
        try {
          await supabase.from('cohort_memberships').insert({
            id: membership.id,
            cohort_id: membership.cohortId,
            student_id: membership.studentId,
            student_name: membership.studentName,
            student_email: membership.studentEmail || null,
            joined_at: membership.joinedAt,
          });
        } catch (err) {
          console.warn('Failed to persist membership to Supabase:', err);
        }
      }
    }
  }

  const assignments = Array.from(store.assignments.values())
    .filter((a) => a.cohortId === cohort!.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  return { success: true, cohort, membership, assignments };
}

/**
 * Lists all cohorts a student has joined along with their assignments and submitted scores.
 */
export async function listStudentCohorts(
  studentId: string,
  studentEmail?: string
): Promise<StudentCohortBundle[]> {
  const cleanStudentId = sanitizeText(studentId, 100);
  const cleanEmail = studentEmail ? sanitizeText(studentEmail, 120).toLowerCase() : undefined;
  if (!cleanStudentId && !cleanEmail) return [];

  await syncCohortsFromDb();
  const store = getMemoryStore();

  const matchingCohortIds = new Set(
    Array.from(store.memberships.values())
      .filter(
        (m) =>
          m.studentId === cleanStudentId ||
          (cleanEmail && m.studentEmail && m.studentEmail.toLowerCase() === cleanEmail)
      )
      .map((m) => m.cohortId)
  );

  const bundles: StudentCohortBundle[] = [];
  for (const cohortId of matchingCohortIds) {
    const cohort = store.cohorts.get(cohortId);
    if (!cohort) continue;

    const assignments = Array.from(store.assignments.values())
      .filter((a) => a.cohortId === cohort.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    const submissions = Array.from(store.submissions.values())
      .filter((s) => {
        if (s.cohortId !== cohort.id) return false;
        if (cleanStudentId && s.studentId === cleanStudentId) return true;
        return false;
      })
      .sort((a, b) => b.submittedAt - a.submittedAt);

    bundles.push({ cohort, assignments, submissions });
  }

  return bundles.sort((a, b) => b.cohort.createdAt - a.cohort.createdAt);
}

/**
 * Assigns an official or custom IELTS writing prompt to a teacher's cohort.
 */
export async function createCohortAssignment(params: {
  cohortId: string;
  requesterId: string;
  isAdmin?: boolean;
  prompt: IELTSTaskPrompt;
  teacherNotes?: string;
  dueDate?: string;
}): Promise<{ status: 'OK'; assignment: CohortAssignment } | { status: 'NOT_FOUND' } | { status: 'FORBIDDEN' }> {
  const cohort = await findCohortById(params.cohortId);
  if (!cohort) return { status: 'NOT_FOUND' };
  if (!params.isAdmin && cohort.teacherId !== params.requesterId) {
    return { status: 'FORBIDDEN' };
  }

  const sanitizedPrompt = sanitizeTaskPrompt(params.prompt);
  const teacherNotes = sanitizeText(params.teacherNotes, 500) || undefined;
  const rawDueDate = sanitizeText(params.dueDate, 20);
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDueDate) ? rawDueDate : undefined;

  const assignment: CohortAssignment = {
    id: `assign-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    cohortId: cohort.id,
    prompt: sanitizedPrompt,
    teacherNotes,
    dueDate,
    assignedBy: params.requesterId,
    createdAt: Date.now(),
  };

  const store = getMemoryStore();
  store.assignments.set(assignment.id, assignment);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        await turso.execute({
          sql: `INSERT INTO cohort_assignments (id, cohort_id, prompt_id, prompt_data, teacher_notes, due_date, assigned_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            assignment.id,
            assignment.cohortId,
            assignment.prompt.id,
            JSON.stringify(assignment.prompt),
            assignment.teacherNotes || null,
            assignment.dueDate || null,
            assignment.assignedBy,
            assignment.createdAt,
          ],
        });
      } catch (err) {
        console.warn('Failed to persist assignment to Turso:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('cohort_assignments').insert({
          id: assignment.id,
          cohort_id: assignment.cohortId,
          prompt_id: assignment.prompt.id,
          prompt_data: assignment.prompt,
          teacher_notes: assignment.teacherNotes || null,
          due_date: assignment.dueDate || null,
          assigned_by: assignment.assignedBy,
          created_at: assignment.createdAt,
        });
      } catch (err) {
        console.warn('Failed to persist assignment to Supabase:', err);
      }
    }
  }

  return { status: 'OK', assignment };
}

/**
 * Deletes an assignment from a teacher's cohort.
 */
export async function deleteCohortAssignment(params: {
  cohortId: string;
  assignmentId: string;
  requesterId: string;
  isAdmin?: boolean;
}): Promise<'OK' | 'NOT_FOUND' | 'FORBIDDEN'> {
  const cohort = await findCohortById(params.cohortId);
  if (!cohort) return 'NOT_FOUND';
  if (!params.isAdmin && cohort.teacherId !== params.requesterId) {
    return 'FORBIDDEN';
  }

  const store = getMemoryStore();
  store.assignments.delete(params.assignmentId);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await turso.execute({
          sql: `DELETE FROM cohort_assignments WHERE id = ? AND cohort_id = ?`,
          args: [params.assignmentId, params.cohortId],
        });
      } catch (err) {
        console.warn('Failed to delete assignment from Turso:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('cohort_assignments')
          .delete()
          .eq('id', params.assignmentId)
          .eq('cohort_id', params.cohortId);
      } catch (err) {
        console.warn('Failed to delete assignment from Supabase:', err);
      }
    }
  }

  return 'OK';
}

async function persistCohortSubmissionItem(item: CohortSubmissionItem): Promise<void> {
  const store = getMemoryStore();
  store.submissions.set(`${item.cohortId}:${item.reportId}`, item);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await ensureB2BTables(turso);
        await turso.execute({
          sql: `INSERT OR REPLACE INTO cohort_submissions
                (id, report_id, cohort_id, assignment_id, student_id, student_name, prompt_id, prompt_title, task_type, word_count, overall_band, ta_score, cc_score, lr_score, gra_score, teacher_feedback, reviewed_at, submitted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            item.id,
            item.reportId,
            item.cohortId,
            item.assignmentId || null,
            item.studentId,
            item.studentName,
            item.promptId,
            item.promptTitle,
            item.taskType,
            item.wordCount,
            item.overallBand,
            item.taskResponseScore,
            item.coherenceScore,
            item.lexicalScore,
            item.grammarScore,
            item.teacherFeedback || null,
            item.reviewedAt || null,
            item.submittedAt,
          ],
        });
      } catch (err) {
        console.warn('Failed to persist cohort submission to Turso:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('cohort_submissions').upsert({
          id: item.id,
          report_id: item.reportId,
          cohort_id: item.cohortId,
          assignment_id: item.assignmentId || null,
          student_id: item.studentId,
          student_name: item.studentName,
          prompt_id: item.promptId,
          prompt_title: item.promptTitle,
          task_type: item.taskType,
          word_count: item.wordCount,
          overall_band: item.overallBand,
          ta_score: item.taskResponseScore,
          cc_score: item.coherenceScore,
          lr_score: item.lexicalScore,
          gra_score: item.grammarScore,
          teacher_feedback: item.teacherFeedback || null,
          reviewed_at: item.reviewedAt || null,
          submitted_at: item.submittedAt,
        });
      } catch (err) {
        console.warn('Failed to persist cohort submission to Supabase:', err);
      }
    }
  }
}

/**
 * Links an evaluated submission report to explicit cohort/assignment metadata or matching student assignments.
 */
export async function recordCohortSubmission(params: {
  report: SubmissionReport;
  studentId?: string;
  studentName?: string;
  cohortId?: string;
  assignmentId?: string;
}): Promise<void> {
  const cleanStudentId = sanitizeText(params.studentId, 100) || 'student-guest';
  const cleanStudentName =
    sanitizeText(params.studentName || params.report.candidateName, 80) || 'Student Candidate';
  const targetMatches: Array<{ cohortId: string; assignmentId?: string }> = [];

  if (params.cohortId) {
    const cohort = await findCohortById(params.cohortId);
    if (cohort) {
      targetMatches.push({
        cohortId: cohort.id,
        assignmentId: params.assignmentId,
      });
    }
  } else if (params.studentId) {
    const studentCohorts = await listStudentCohorts(cleanStudentId);
    for (const bundle of studentCohorts) {
      const matchedAssign = bundle.assignments.find(
        (a) => a.prompt.id === params.report.taskPrompt.id
      );
      if (matchedAssign) {
        targetMatches.push({
          cohortId: bundle.cohort.id,
          assignmentId: matchedAssign.id,
        });
      }
    }
  }

  for (const target of targetMatches) {
    const item: CohortSubmissionItem = {
      id: `csub-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      reportId: params.report.id,
      cohortId: target.cohortId,
      assignmentId: target.assignmentId,
      studentId: cleanStudentId,
      studentName: cleanStudentName,
      promptId: params.report.taskPrompt.id,
      promptTitle: params.report.taskPrompt.title,
      taskType: params.report.taskPrompt.type,
      wordCount: params.report.wordCount,
      overallBand: params.report.layer1ExaminerReport.overallBand,
      taskResponseScore: params.report.layer1ExaminerReport.taskResponse.score,
      coherenceScore: params.report.layer1ExaminerReport.coherenceCohesion.score,
      lexicalScore: params.report.layer1ExaminerReport.lexicalResource.score,
      grammarScore: params.report.layer1ExaminerReport.grammaticalAccuracy.score,
      submittedAt: params.report.timestamp || Date.now(),
    };

    await persistCohortSubmissionItem(item);
  }
}

/**
 * Saves instructor feedback on a student's cohort submission report.
 */
export async function saveTeacherFeedback(params: {
  cohortId: string;
  reportId: string;
  feedback: string;
  requesterId: string;
  isAdmin?: boolean;
}): Promise<{ status: 'OK'; submission: CohortSubmissionItem } | { status: 'NOT_FOUND' } | { status: 'FORBIDDEN' }> {
  const cohort = await findCohortById(params.cohortId);
  if (!cohort) return { status: 'NOT_FOUND' };
  if (!params.isAdmin && cohort.teacherId !== params.requesterId) {
    return { status: 'FORBIDDEN' };
  }

  const store = getMemoryStore();
  const key = `${params.cohortId}:${params.reportId}`;
  const existing = store.submissions.get(key);
  if (!existing) return { status: 'NOT_FOUND' };

  const cleanFeedback = sanitizeText(params.feedback, 1500);
  const reviewedAt = Date.now();
  const updated: CohortSubmissionItem = {
    ...existing,
    teacherFeedback: cleanFeedback,
    reviewedAt,
  };

  store.submissions.set(key, updated);

  if (isTursoConfigured()) {
    const turso = getTursoClient();
    if (turso) {
      try {
        await turso.execute({
          sql: `UPDATE cohort_submissions SET teacher_feedback = ?, reviewed_at = ? WHERE cohort_id = ? AND report_id = ?`,
          args: [cleanFeedback, reviewedAt, params.cohortId, params.reportId],
        });
      } catch (err) {
        console.warn('Failed to update teacher feedback in Turso:', err);
      }
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('cohort_submissions')
          .update({
            teacher_feedback: cleanFeedback,
            reviewed_at: updated.reviewedAt,
          })
          .eq('cohort_id', params.cohortId)
          .eq('report_id', params.reportId);
      } catch (err) {
        console.warn('Failed to update teacher feedback in Supabase:', err);
      }
    }
  }

  return { status: 'OK', submission: updated };
}

/**
 * Creates a realistic sample cohort with assignments and cached evaluated reports for quick B2B evaluation.
 */
export async function seedSampleCohortDemo(params: {
  teacherId: string;
  teacherName: string;
  schoolName?: string;
}): Promise<CohortDetailBundle> {
  const cohort = await createCohort({
    name: 'IELTS Academic Writing — Autumn Intensive',
    schoolName: params.schoolName || 'Oxford Bridge Language Institute',
    targetBand: '7.5',
    teacherId: params.teacherId,
    teacherName: params.teacherName,
  });

  const promptOne = OFFICIAL_PROMPTS_DATABASE[0];
  const promptTwo =
    OFFICIAL_PROMPTS_DATABASE.find((p) => p.type === 'TASK_1_ACADEMIC') ||
    OFFICIAL_PROMPTS_DATABASE[1];

  const assign1Res = await createCohortAssignment({
    cohortId: cohort.id,
    requesterId: params.teacherId,
    isAdmin: true,
    prompt: promptOne,
    teacherNotes:
      'Focus on clear paragraphing (4 paragraphs) and academic hedging in Body 2 before peer review.',
    dueDate: '2026-11-25',
  });

  await createCohortAssignment({
    cohortId: cohort.id,
    requesterId: params.teacherId,
    isAdmin: true,
    prompt: promptTwo,
    teacherNotes:
      'Include a distinct Overview paragraph summarizing main shifts without citing raw figures.',
    dueDate: '2026-11-28',
  });

  const sampleStudents = [
    {
      id: `demo-stu-1-${cohort.id}`,
      name: 'Madina Karimova',
      email: 'madina.k@student.edu',
      essay:
        'In the contemporary era, widespread proliferation of digital platforms has fundamentally transformed modern university instruction.\n\nProponents argue that remote lectures offer unprecedented flexibility and lower institutional costs. Nevertheless, sustained critical engagement often requires face-to-face seminar collaboration where students debate complex concepts directly with mentors.\n\nConversely, hybrid curricula can mitigate geographic barriers when institutions pair recorded theoretical modules with interactive laboratory workshops. For example, engineering faculties can preserve rigorous practical competence while expanding enrollment.\n\nIn conclusion, although online resources enhance accessibility, physical campus dialogue remains indispensable to holistic cognitive development.',
    },
    {
      id: `demo-stu-2-${cohort.id}`,
      name: 'Azizbek Tursunov',
      email: 'azizbek.t@student.edu',
      essay:
        'Nowadays, a lot of kids and university students use online study tools. This is very important for education because people is busy.\n\nBut online learning can be a big problem when students lose focus. Some teachers think things get worse if learners never visit classrooms.\n\nIn conclusion, universities should balance online lessons and traditional classes.',
    },
  ];

  const assignmentId = assign1Res.status === 'OK' ? assign1Res.assignment.id : undefined;

  for (const stu of sampleStudents) {
    await joinCohortByCode({
      joinCode: cohort.joinCode,
      studentId: stu.id,
      studentName: stu.name,
      studentEmail: stu.email,
    });

    const report = generateMockSubmissionEvaluation(
      stu.essay,
      '7.5',
      promptOne,
      'ACTIVE_ASSISTANT',
      stu.name
    );
    cacheReportInMemory(report);
    await recordCohortSubmission({
      report,
      studentId: stu.id,
      studentName: stu.name,
      cohortId: cohort.id,
      assignmentId,
    });
  }

  const detailRes = await getCohortDetail(cohort.id, params.teacherId, true);
  if (detailRes.status === 'OK') {
    return detailRes.detail;
  }

  return { cohort, members: [], assignments: [], submissions: [] };
}
