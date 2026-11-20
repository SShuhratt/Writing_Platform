import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateMockSocraticGuidance } from '@/lib/ai-service';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import { checkAndRecordGuidanceQuota } from '@/lib/quota-service';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { logStructuredError, validateGuidancePayload } from '@/lib/validation';
import {
  sanitizeEssayInput,
  sanitizeTargetBand,
  sanitizeTaskPrompt,
  LLM_ANTI_INJECTION_DIRECTIVES,
} from '@/lib/security-sanitize';

function isMockGuidanceAllowed(): boolean {
  return (
    process.env.ALLOW_MOCK_EVALUATION === 'true' &&
    process.env.NODE_ENV !== 'production'
  );
}

export async function POST(req: Request) {
  // 1. Rate Limiting Protection (30 requests / min per token or IP)
  const rateLimitResult = await checkRateLimitAsync(req, {
    limit: 30,
    windowMs: 60 * 1000,
    prefix: 'guidance',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  let bodyData: any = {};
  try {
    // 2. Mandatory Authentication
    const authUser = verifyAuthenticatedRequest(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'AUTHENTICATION_REQUIRED', message: 'Please sign in to access live Socratic coaching.' },
        { status: 401 }
      );
    }

    bodyData = await req.json();
    const { essayText: rawEssay, targetBand: rawBand, prompt: rawPrompt } = bodyData;

    // 3. Input Sanitization & Anti-Injection Guardrails
    const { cleanText: essayText, isValid, error } = sanitizeEssayInput(rawEssay);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const targetBand = sanitizeTargetBand(rawBand);
    const prompt = sanitizeTaskPrompt(rawPrompt);

    // 4. Daily Socratic Guidance Cap to prevent Gemini cost abuse
    const guidanceQuota = await checkAndRecordGuidanceQuota(req, authUser.userId, authUser.role);
    if (!guidanceQuota.allowed) {
      return NextResponse.json(
        {
          error: 'DAILY_GUIDANCE_QUOTA_EXCEEDED',
          message: `Daily live Socratic coaching cap (${guidanceQuota.limit}/day on ${guidanceQuota.planCode}) reached. You can still finish writing and submit your essay.`,
          planCode: guidanceQuota.planCode,
          limit: guidanceQuota.limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (isMockGuidanceAllowed()) {
        return NextResponse.json(generateMockSocraticGuidance(essayText, targetBand, prompt));
      }
      return NextResponse.json(
        { error: 'AI_TEMPORARILY_UNAVAILABLE', message: 'Live coaching AI is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];

    const isTask1Academic = prompt.type === 'TASK_1_ACADEMIC';
    const isTask1General = prompt.type === 'TASK_1_GENERAL';
    const taskPedagogicalGuideline = isTask1Academic
      ? 'TASK 1 ACADEMIC REPORT (Min 150 words): Check for clear Introduction paraphrasing the visual, a critical OVERVIEW paragraph highlighting general trends/extremes WITHOUT raw data, and body paragraphs comparing specific data points. Do NOT suggest personal opinions, thesis statements, or counter-arguments!'
      : isTask1General
      ? 'TASK 1 GENERAL TRAINING LETTER (Min 150 words): Check for clear letter purpose, full coverage of all bullet points, consistent tone (formal/semi-formal/informal), and conventional letter salutation and sign-off.'
      : 'TASK 2 ESSAY (Min 250 words): Check for Introduction (paraphrase + explicit thesis), body paragraphs with PEEL structure (Point, Explanation, Evidence, Link), and a conclusive synthesis without new unargued points.';

    const systemPrompt = `You are the Real-Time Socratic Mentor for an IELTS Writing Assistant Platform.

${LLM_ANTI_INJECTION_DIRECTIVES}

STRICT PEDAGOGICAL GUARDRAILS:
1. You MUST NOT under any circumstances provide rewritten sentences, ready-to-use phrases, direct replacements, or copy-paste text.
2. Provide ONLY conceptual, instructional, and Socratic guidance. Ask thought-provoking questions to guide the student's own revision.
3. Your feedback MUST strictly reflect the requirements of the selected Target Band Score: Band ${targetBand}.

TASK SPECIFICATION:
- Task Type: ${prompt.type}
- Task Rule: ${taskPedagogicalGuideline}

EVALUATION FOCUS AREAS FOR LIVE WRITING:
- Structure & Progression: Check paragraphing and clear discourse transitions.
- Task Fulfillment: ${isTask1Academic ? 'Check for a clear Overview paragraph and data grouping.' : isTask1General ? 'Check that all bullet points are addressed with proper register.' : 'Check thesis statement and balanced argument development.'}
- Lexical Resource Elevation: Highlight overused simple words and prompt for higher-register academic collocations.
- Sentence Control: Prompt for syntactic variety (concessive clauses, passives, complex structures) suitable for Band ${targetBand}.

TASK PROMPT:
${prompt.title} (${prompt.questionText})

CANDIDATE ESSAY:
<candidate_essay>
${essayText}
</candidate_essay>

Evaluate the essay against Band ${targetBand} IELTS criteria:
- Task Achievement / Response (TA/TR)
- Coherence & Cohesion (CC)
- Lexical Resource (LR)
- Grammatical Range & Accuracy (GRA)

Respond with valid JSON using this structure:
{
  "cards": [
    {
      "id": "card-1",
      "category": "LEXICAL_RESOURCE" | "COHERENCE_COHESION" | "TASK_RESPONSE",
      "paragraphIndex": number,
      "highlightSnippet": "snippet of student text",
      "title": "Short Title",
      "socraticPrompt": "Socratic question/instruction without giving direct rewrites",
      "targetBandContext": "${targetBand}"
    }
  ],
  "levelOffer": null | {
    "type": "UPWARD" | "DOWNWARD",
    "suggestedBand": "5.0" to "9.0",
    "reason": "Clear non-modal explanation why user should adjust band target"
  }
}`;

    let parsedData: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(systemPrompt, { timeout: 14000 });
        const rawText = result.response.text();
        if (!rawText) continue;

        const cleanText = rawText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const candidateJson = JSON.parse(cleanText);
        if (!validateGuidancePayload(candidateJson)) {
          lastError = new Error('Invalid guidance JSON payload');
          continue;
        }
        parsedData = candidateJson;
        break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed in /api/guidance, trying next:`, err?.message?.slice(0, 100));
        lastError = err;
      }
    }

    if (!parsedData) {
      logStructuredError('guidance.allModelsFailed', lastError);
      if (isMockGuidanceAllowed()) {
        return NextResponse.json(generateMockSocraticGuidance(essayText, targetBand, prompt));
      }
      return NextResponse.json(
        { error: 'AI_TEMPORARILY_UNAVAILABLE', message: 'Live coaching AI could not respond right now.' },
        { status: 503 }
      );
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    logStructuredError('guidance.unhandled', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate guidance' }, { status: 500 });
  }
}
