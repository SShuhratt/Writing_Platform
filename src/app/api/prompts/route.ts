import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';
import { IELTSTaskPrompt } from '@/types/ielts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'TASK_1_ACADEMIC', 'TASK_1_GENERAL', 'TASK_2_ESSAY', or 'TASK_1'
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 1. Try querying Supabase if credentials exist
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
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

        const { data, error, count } = await query;

        if (!error && data && data.length > 0) {
          const prompts: IELTSTaskPrompt[] = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            type: row.type,
            category: row.category,
            questionText: row.question_text,
            chartDescription: row.chart_description || undefined,
            illustrationType: row.illustration_type || undefined,
            minWordCount: row.min_word_count,
            recommendedTimeMinutes: row.recommended_time_minutes,
          }));

          return NextResponse.json({
            success: true,
            prompts,
            total: count ?? prompts.length,
            source: 'supabase',
          });
        }
      }
    }

    // 2. Fallback to in-memory OFFICIAL_PROMPTS_DATABASE (160 items)
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
  try {
    const body = await request.json();
    const { title, type, category, questionText, minWordCount, recommendedTimeMinutes } = body;

    if (!title || !questionText || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required prompt fields (title, type, questionText)' },
        { status: 400 }
      );
    }

    const newPromptId = `custom-${Date.now()}`;
    const newPrompt: IELTSTaskPrompt = {
      id: newPromptId,
      title,
      type,
      category: category || 'Custom Practice Task',
      questionText,
      minWordCount: minWordCount || (type === 'TASK_2_ESSAY' ? 250 : 150),
      recommendedTimeMinutes: recommendedTimeMinutes || (type === 'TASK_2_ESSAY' ? 40 : 20),
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('prompts').insert({
          id: newPrompt.id,
          title: newPrompt.title,
          type: newPrompt.type,
          category: newPrompt.category,
          question_text: newPrompt.questionText,
          min_word_count: newPrompt.minWordCount,
          recommended_time_minutes: newPrompt.recommendedTimeMinutes,
        });

        if (error) {
          console.warn('Could not insert custom prompt into Supabase:', error.message);
        }
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
