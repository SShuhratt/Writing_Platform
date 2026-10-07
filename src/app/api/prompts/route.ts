import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient, isTursoConfigured } from '@/lib/turso';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { IELTSTaskPrompt } from '@/types/ielts';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // 1. Rate Limiting Protection (60 requests / min per IP)
  const rateLimitResult = checkRateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    prefix: 'prompts_get',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const rawSearch = searchParams.get('search')?.toLowerCase().trim() || '';
    
    // Sanitize search query against wildcard or excessive length abuse
    const search = rawSearch.slice(0, 100).replace(/[%_]/g, '\\$&');

    // Strict boundary checks on limit and offset to mitigate malicious mass data extraction & memory exhaustion
    const rawLimit = parseInt(searchParams.get('limit') || '250', 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 250);

    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    // 1. Try Turso LibSQL Database first if configured (Parameterized Queries to prevent SQL Injection)
    if (isTursoConfigured()) {
      const turso = getTursoClient();
      if (turso) {
        try {
          const whereClauses: string[] = [];
          const args: any[] = [];

          if (type) {
            if (type === 'TASK_1') {
              whereClauses.push("type IN ('TASK_1_ACADEMIC', 'TASK_1_GENERAL')");
            } else {
              whereClauses.push('type = ?');
              args.push(type);
            }
          }

          if (category && category !== 'ALL') {
            whereClauses.push('category LIKE ?');
            args.push(`%${category}%`);
          }

          if (search) {
            whereClauses.push('(LOWER(title) LIKE ? OR LOWER(question_text) LIKE ? OR LOWER(category) LIKE ?)');
            const sArg = `%${search}%`;
            args.push(sArg, sArg, sArg);
          }

          const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
          const sql = `SELECT * FROM prompts ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`;
          args.push(limit, offset);

          const result = await turso.execute({ sql, args });

          if (result.rows.length > 0) {
            const prompts: IELTSTaskPrompt[] = result.rows.map((row: any) => ({
              id: String(row.id),
              title: String(row.title),
              type: row.type as any,
              category: String(row.category),
              questionText: String(row.question_text),
              chartDescription: row.chart_description ? String(row.chart_description) : undefined,
              illustrationType: row.illustration_type ? (row.illustration_type as any) : undefined,
              minWordCount: Number(row.min_word_count || 250),
              recommendedTimeMinutes: Number(row.recommended_time_minutes || 40),
            }));

            return NextResponse.json({
              success: true,
              prompts,
              total: prompts.length,
              source: 'turso',
            });
          }
        } catch (tursoErr) {
          console.warn('Turso query fallback:', tursoErr);
        }
      }
    }

    // 2. Try Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase.from('prompts').select('*', { count: 'exact' });

          if (type) {
            if (type === 'TASK_1') {
              query = query.in('type', ['TASK_1_ACADEMIC', 'TASK_1_GENERAL']);
            } else {
              query = query.eq('type', type);
            }
          }

          if (category && category !== 'ALL') {
            query = query.ilike('category', `%${category}%`);
          }

          if (search) {
            query = query.or(`title.ilike.%${search}%,question_text.ilike.%${search}%,category.ilike.%${search}%`);
          }

          query = query.order('id', { ascending: true }).range(offset, offset + limit - 1);
          const { data, count, error } = await query;

          if (!error && data && data.length > 0) {
            const prompts: IELTSTaskPrompt[] = data.map((row: any) => ({
              id: String(row.id),
              title: String(row.title),
              type: row.type,
              category: String(row.category),
              questionText: String(row.question_text),
              chartDescription: row.chart_description ? String(row.chart_description) : undefined,
              illustrationType: row.illustration_type,
              minWordCount: Number(row.min_word_count || 250),
              recommendedTimeMinutes: Number(row.recommended_time_minutes || 40),
            }));

            return NextResponse.json({
              success: true,
              prompts,
              total: count || prompts.length,
              source: 'supabase',
            });
          }
        } catch (supaErr) {
          console.warn('Supabase query fallback:', supaErr);
        }
      }
    }

    // 3. Fallback to in-memory OFFICIAL_PROMPTS_DATABASE
    let filtered = OFFICIAL_PROMPTS_DATABASE;

    if (type) {
      if (type === 'TASK_1') {
        filtered = filtered.filter(p => p.type === 'TASK_1_ACADEMIC' || p.type === 'TASK_1_GENERAL');
      } else {
        filtered = filtered.filter(p => p.type === type);
      }
    }

    if (category && category !== 'ALL') {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.questionText.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      prompts: paginated,
      total,
      source: 'fallback',
    });
  } catch (error: any) {
    console.error('API /api/prompts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        prompts: OFFICIAL_PROMPTS_DATABASE.slice(0, 50),
        total: OFFICIAL_PROMPTS_DATABASE.length,
        source: 'fallback_error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 1. Rate Limiting Protection (10 requests / min per IP to prevent spamming DB)
  const rateLimitResult = checkRateLimit(request, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: 'prompts_post',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { title, type, category, questionText, minWordCount, recommendedTimeMinutes } = body;

    // Strict input validation & sanitization
    if (!title || !questionText || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required prompt fields (title, type, questionText)' },
        { status: 400 }
      );
    }

    const validTypes = ['TASK_1_ACADEMIC', 'TASK_1_GENERAL', 'TASK_2_ESSAY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IELTS prompt type specified' },
        { status: 400 }
      );
    }

    const sanitizedTitle = String(title).slice(0, 180).trim().replace(/[<>]/g, '');
    const sanitizedQuestion = String(questionText).slice(0, 2500).trim().replace(/[<>]/g, '');
    const sanitizedCategory = String(category || 'Custom Practice Task').slice(0, 80).trim().replace(/[<>]/g, '');
    const sanitizedMinWord = Math.min(Math.max(50, Number(minWordCount) || (type === 'TASK_2_ESSAY' ? 250 : 150)), 600);
    const sanitizedTime = Math.min(Math.max(5, Number(recommendedTimeMinutes) || (type === 'TASK_2_ESSAY' ? 40 : 20)), 120);

    const newPromptId = `custom-${Date.now()}`;
    const newPrompt: IELTSTaskPrompt = {
      id: newPromptId,
      title: sanitizedTitle,
      type,
      category: sanitizedCategory,
      questionText: sanitizedQuestion,
      minWordCount: sanitizedMinWord,
      recommendedTimeMinutes: sanitizedTime,
    };

    if (isTursoConfigured()) {
      const turso = getTursoClient();
      if (turso) {
        await turso.execute({
          sql: `INSERT INTO prompts (id, title, type, category, question_text, min_word_count, recommended_time_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newPrompt.id,
            newPrompt.title,
            newPrompt.type,
            newPrompt.category,
            newPrompt.questionText,
            newPrompt.minWordCount,
            newPrompt.recommendedTimeMinutes,
          ],
        });
      }
    } else if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('prompts').insert({
          id: newPrompt.id,
          title: newPrompt.title,
          type: newPrompt.type,
          category: newPrompt.category,
          question_text: newPrompt.questionText,
          min_word_count: newPrompt.minWordCount,
          recommended_time_minutes: newPrompt.recommendedTimeMinutes,
        });
      }
    }

    return NextResponse.json({
      success: true,
      prompt: newPrompt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save prompt' },
      { status: 500 }
    );
  }
}
