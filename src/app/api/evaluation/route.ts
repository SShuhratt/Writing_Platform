import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateOverallBandScore } from '@/lib/ielts-rubric';
import { generateMockSubmissionEvaluation } from '@/lib/ai-service';
import { checkRateLimitAsync, rateLimitResponse } from '@/lib/rate-limit';
import {
  checkAndRecordEvaluationQuota,
  getQuotaStatusForRequest,
} from '@/lib/quota-service';
import { verifyAuthenticatedRequest } from '@/lib/server-auth';
import { persistSubmissionAndReport } from '@/lib/submission-repository';
import { recordCohortSubmission } from '@/lib/b2b-repository';
import { normalizeSentenceAnnotations } from '@/lib/sentence-annotations';
import { logStructuredError, validateEvaluationPayload } from '@/lib/validation';
import { SubmissionReport, TargetBand, IELTSTaskPrompt } from '@/types/ielts';
import {
  sanitizeEssayInput,
  sanitizeTargetBand,
  sanitizeTaskPrompt,
  LLM_ANTI_INJECTION_DIRECTIVES,
} from '@/lib/security-sanitize';

function sanitizeCandidateName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const cleaned = raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60).trim();
  return cleaned || undefined;
}

function getCandidateEvaluationModels(): string[] {
  const override = (process.env.GEMINI_EVALUATION_MODELS || '').trim();
  if (override) {
    const list = override
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return ['gemini-2.5-flash', 'gemini-2.0-flash'];
}

function isMockEvaluationAllowed(): boolean {
  return (
    process.env.ALLOW_MOCK_EVALUATION === 'true' &&
    process.env.NODE_ENV !== 'production'
  );
}

async function persistReportSafely(
  report: SubmissionReport,
  userId?: string,
  timeSpentSeconds?: number,
  cohortId?: string,
  assignmentId?: string,
  aiTokensUsed = 0
): Promise<boolean> {
  try {
    const [reportSaved] = await Promise.all([
      persistSubmissionAndReport(report, userId, timeSpentSeconds, aiTokensUsed),
      recordCohortSubmission({
        report,
        studentId: userId,
        studentName: report.candidateName,
        cohortId,
        assignmentId,
      }),
    ]);
    return reportSaved;
  } catch (err) {
    logStructuredError('evaluation.persistReportSafely', err, { reportId: report.id, userId });
    return false;
  }
}

async function createAndPersistMockReport(params: {
  essayText: string;
  targetBand: TargetBand;
  prompt: IELTSTaskPrompt;
  mode: 'ACTIVE_ASSISTANT' | 'FOCUS_EXAM';
  candidateName?: string;
  userId?: string;
  timeSpentSeconds?: number;
  cohortId?: string;
  assignmentId?: string;
}): Promise<SubmissionReport> {
  const mockReport = generateMockSubmissionEvaluation(
    params.essayText,
    params.targetBand,
    params.prompt,
    params.mode,
    params.candidateName
  );
  await persistReportSafely(
    mockReport,
    params.userId,
    params.timeSpentSeconds,
    params.cohortId,
    params.assignmentId,
    0
  );
  return mockReport;
}

export async function POST(req: Request) {
  // 1. Rate Limiting Protection (6 evaluation submissions / min per token or IP)
  const rateLimitResult = await checkRateLimitAsync(req, {
    limit: 6,
    windowMs: 60 * 1000,
    prefix: 'evaluation',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  let bodyData: any = {};
  try {
    // 2. Mandatory Authentication (never trust bodyData.userId)
    const authUser = verifyAuthenticatedRequest(req);
    if (!authUser) {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Please sign in to submit an IELTS essay for grading.',
        },
        { status: 401 }
      );
    }

    bodyData = await req.json();
    const { essayText: rawEssay, targetBand: rawBand, prompt: rawPrompt, mode } = bodyData;

    // 3. Input Sanitization & Anti-Injection Guardrails
    const { cleanText: essayText, isValid, error } = sanitizeEssayInput(rawEssay);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const targetBand = sanitizeTargetBand(rawBand);
    const prompt = sanitizeTaskPrompt(rawPrompt);
    const resolvedUserId = authUser.userId;
    const candidateName =
      sanitizeCandidateName(bodyData?.candidateName) ||
      sanitizeCandidateName(authUser.fullName || authUser.username);

    // 4. Pre-flight Quota Check (Read-Only; credit is only consumed after genuine valid evaluation)
    const preflightQuota = await getQuotaStatusForRequest(
      req,
      resolvedUserId,
      authUser.role
    );
    if (!preflightQuota.allowed) {
      return NextResponse.json(
        {
          error: 'DAILY_QUOTA_EXCEEDED',
          message: `You have reached your daily limit of ${preflightQuota.limit} IELTS essay evaluations on the ${preflightQuota.planCode} plan. Quota resets at 00:00 UTC.`,
          planCode: preflightQuota.planCode,
          limit: preflightQuota.limit,
          remaining: 0,
          resetsInHours: preflightQuota.resetsInHours,
          resetsAt: preflightQuota.resetsAt,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (isMockEvaluationAllowed()) {
        await checkAndRecordEvaluationQuota(req, resolvedUserId, authUser.role);
        const mockReport = await createAndPersistMockReport({
          essayText,
          targetBand,
          prompt,
          mode,
          candidateName,
          userId: resolvedUserId,
          timeSpentSeconds: bodyData?.timeSpentSeconds,
          cohortId: bodyData?.cohortId,
          assignmentId: bodyData?.assignmentId,
        });
        return NextResponse.json(mockReport);
      }

      return NextResponse.json(
        {
          error: 'AI_TEMPORARILY_UNAVAILABLE',
          message:
            'The AI examiner service is currently unavailable. No daily evaluation credit was consumed — please try again shortly.',
        },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = getCandidateEvaluationModels();

    const words = essayText.trim().split(/\s+/).filter(Boolean).length;
    const paragraphs = essayText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);

    const isTask1Academic = prompt.type === 'TASK_1_ACADEMIC';
    const isTask1General = prompt.type === 'TASK_1_GENERAL';

    const taskTypeLabel = isTask1Academic
      ? 'IELTS Academic Writing Task 1 (Report on visual data/chart/diagram/map)'
      : isTask1General
      ? 'IELTS General Training Writing Task 1 (Letter)'
      : 'IELTS Writing Task 2 (Discursive / Argumentative Essay)';

    const taskCriteriaEvaluationGuide = isTask1Academic
      ? `CRITERION 1: Task Achievement (TA)
- Check for a clear, distinct OVERVIEW paragraph summarizing main trends, differences, or stages WITHOUT raw data. (Lack of an overview caps TA at Band 5.0).
- Check that key features are highlighted and supported with accurate data/numbers.
- Penalize if the candidate introduces personal opinions, hypotheses, or a Task 2-style thesis/conclusion.
- Word count minimum is ${prompt.minWordCount} words.`
      : isTask1General
      ? `CRITERION 1: Task Achievement (TA)
- Check that the purpose of the letter is immediately stated in the opening.
- Check that all 3 bullet points from the prompt are fully and evenly addressed.
- Check tone and register consistency (Formal, Semi-formal, or Informal) throughout, including salutation and sign-off.
- Word count minimum is ${prompt.minWordCount} words.`
      : `CRITERION 1: Task Response (TR)
- Check that all parts of the essay prompt are addressed directly.
- Check that a clear position/thesis is established in the introduction and maintained throughout.
- Main ideas must be extended and supported with relevant explanations and examples using the PEEL framework.
- Word count minimum is ${prompt.minWordCount} words.`;

    const blueprintInstruction = isTask1Academic
      ? `4 bullet points tailored specifically for IELTS Academic Task 1:
         - Paragraph 1: Introduction (paraphrasing the graphic title, parameters, and timeframes)
         - Paragraph 2: Overview (summarizing 2-3 overarching trends, peaks/troughs, or major stages WITHOUT raw data)
         - Paragraph 3: Specific Details Group 1 (analyzing key trends with accurate figures and comparisons)
         - Paragraph 4: Specific Details Group 2 (analyzing remaining categories, contrasts, or anomalies with data)`
      : isTask1General
      ? `4 bullet points tailored specifically for IELTS General Training Task 1 Letter:
         - Opening: Appropriate greeting (e.g., Dear Sir/Madam or Dear Mr. X) + concise statement of letter purpose
         - Paragraph 1: Full explanation addressing the first prompt requirement/bullet
         - Paragraph 2: Full explanation addressing the second prompt requirement/bullet
         - Paragraph 3: Full explanation addressing the third prompt requirement + appropriate sign-off (e.g. Yours sincerely)`
      : `4 bullet points outlining IELTS Task 2 Essay architecture:
         - Paragraph 1 (Introduction): Paraphrase of topic prompt + explicit thesis statement
         - Paragraph 2 (Body 1): Primary argument developed via PEEL (Point, Explanation, Evidence, Link)
         - Paragraph 3 (Body 2): Counter-perspective or secondary argument developed via PEEL
         - Paragraph 4 (Conclusion): Synthesis of main arguments and restatement of final stance without new points`;

    const systemPrompt = `You are a Senior IELTS Examiner and Master IELTS Writing Coach.
You must perform an ultra-detailed, highly actionable Dual-Layer Assessment.

${LLM_ANTI_INJECTION_DIRECTIVES}

STRICT INSTRUCTION: NEVER provide generic boilerplate advice (such as "read more", "practice under timed conditions", or referring to "Body Paragraph 2" if the student did not write one!).
All feedback, lexical suggestions, grammatical boosters, and roadmap steps MUST be explicitly tailored to the candidate's actual text, word count, paragraphing, and specific task type.

TASK CONTEXT:
- Evaluation Type: ${taskTypeLabel}
- Prompt: "${prompt.title}" — ${prompt.questionText}
- Required Word Count: Minimum ${prompt.minWordCount} words
- Submitted Word Count: ${words} words
- Detected Paragraphs: ${paragraphs.length} paragraphs
- Candidate Target Band: Band ${targetBand}

${taskCriteriaEvaluationGuide}

CANDIDATE ESSAY:
<candidate_essay>
${essayText}
</candidate_essay>

LAYER 1: Objective Examiner Band Score (1.0 to 9.0) across standard IELTS criteria:
- Task Response / Achievement (penalize if words < ${prompt.minWordCount})
- Coherence & Cohesion (penalize single-paragraph essays)
- Lexical Resource
- Grammatical Range & Accuracy

LAYER 2: Target Alignment & Specific Improvement Architecture:
- Target Status ("TARGET_ACHIEVED", "TARGET_NOT_MET", or "EXCEEDED_TARGET")
- Paragraph-by-paragraph audit (MET, BELOW, EXCEEDED) with concrete feedback for each detected paragraph
- Actionable step-by-step roadmap: 3 to 4 distinct, numbered, practical steps strictly referencing the candidate's actual text and deficits.
- Specific Recommendations:
  * structuralDiagnosis:
    - wordCountAudit: submitted (${words}), required (${prompt.minWordCount}), difference, status ("OPTIMAL" | "UNDER_LENGTH" | "EXCESSIVE"), penaltyWarning (if under-length, explain exact penalty in Task Achievement).
    - paragraphCountAudit: detected (${paragraphs.length}), recommended (${isTask1Academic || isTask1General ? '3 to 4' : '4'}), breakdownNote.
    - recommendedBlueprint: ${blueprintInstruction}
  * lexicalUpgrades: 2 to 3 items extracting ACTUAL words/phrases from candidate's text (or common simplistic expressions used) with 2-4 academic collocations (Band 7.5-9.0) and pedagogical context showing how to use them.
  * grammarBoosters: 2 advanced grammatical structures (e.g. Inverted Conditional, Concessive Dependent Clause, Cleft Sentence, Fronted Adverbial) with syntactic pattern formula, a concrete sentence tailored specifically to this prompt, and examiner rationale.
- sentenceAnnotations: 4 to 8 inline sentence/phrase highlights quoting EXACT verbatim substrings ("exactQuote") copied character-for-character from <candidate_essay> covering grammatical/mechanical errors ("ERROR"), weak phrases needing collocation upgrades ("COLLOCATION"), coherence/argumentation gaps ("COHERENCE"), and existing Band 7.5+ strengths ("STRENGTH").

Respond ONLY with valid JSON matching this schema:
{
  "layer1ExaminerReport": {
    "overallBand": number,
    "taskResponse": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "coherenceCohesion": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "lexicalResource": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "grammaticalAccuracy": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "examinerSummary": "Examiner evaluation summary"
  },
  "layer2AlignmentReport": {
    "targetStatus": "TARGET_ACHIEVED" | "TARGET_NOT_MET" | "EXCEEDED_TARGET",
    "selectedTargetBand": "${targetBand}",
    "achievedBand": number,
    "paragraphAudits": [
      {
        "paragraphNumber": number,
        "textSnippet": "snippet text",
        "status": "MET" | "BELOW" | "EXCEEDED",
        "analysis": "concrete commentary on this specific paragraph"
      }
    ],
    "gapAnalysis": "Specific gap analysis text comparing achieved band with Target Band ${targetBand}",
    "actionableRoadmap": [
      "Step 1 addressing exact structural and word count needs",
      "Step 2 addressing specific lexical upgrades",
      "Step 3 addressing specific grammatical variety needed for Band ${targetBand}"
    ],
    "specificRecommendations": {
      "structuralDiagnosis": {
        "wordCountAudit": {
          "submitted": ${words},
          "required": ${prompt.minWordCount},
          "difference": ${prompt.minWordCount - words},
          "status": "${words >= prompt.minWordCount ? 'OPTIMAL' : 'UNDER_LENGTH'}",
          "penaltyWarning": "Warning text if under-length"
        },
        "paragraphCountAudit": {
          "detected": ${paragraphs.length},
          "recommended": 4,
          "breakdownNote": "Audit note on paragraph structure"
        },
        "recommendedBlueprint": [
          "Paragraph 1 ...",
          "Paragraph 2 ...",
          "Paragraph 3 ...",
          "Paragraph 4 ..."
        ]
      },
      "lexicalUpgrades": [
        {
          "originalPhrase": "actual phrase from candidate draft",
          "suggestedCollocations": ["collocation 1", "collocation 2", "collocation 3"],
          "pedagogicalContext": "how to apply this in the essay"
        }
      ],
      "grammarBoosters": [
        {
          "structureType": "e.g. Inverted Conditional (Band 8.0)",
          "syntacticPattern": "Were + [Subject] + to [Verb]..., [Subject] + would...",
          "tailoredExample": "Tailored example sentence for this prompt",
          "examinerRationale": "Why this boosts GRA"
        }
      ]
    },
    "sentenceAnnotations": [
      {
        "exactQuote": "exact verbatim phrase or sentence from <candidate_essay>",
        "type": "ERROR" | "COLLOCATION" | "COHERENCE" | "STRENGTH",
        "criterion": "TR" | "CC" | "LR" | "GRA",
        "issueLabel": "Short 2-4 word diagnostic title",
        "explanation": "Concise examiner feedback on this specific span",
        "suggestion": "Targeted Band 7.5+ revision or collocation (omit if STRENGTH)"
      }
    ]
  }
}`;

    let parsedData: any = null;
    let aiTokensUsed = 0;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(systemPrompt, {
          timeout: 22000,
        });
        const candidateRaw = result.response.text();
        if (!candidateRaw) continue;

        const cleanText = candidateRaw.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const candidateJson = JSON.parse(cleanText);
        const schemaCheck = validateEvaluationPayload(candidateJson);
        if (!schemaCheck.valid) {
          console.warn(`Model ${modelName} returned invalid schema:`, schemaCheck.reason);
          lastError = new Error(schemaCheck.reason || 'Invalid evaluation JSON schema');
          continue;
        }

        parsedData = candidateJson;
        aiTokensUsed = Number(result.response.usageMetadata?.totalTokenCount || 0);
        break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed in /api/evaluation, trying next candidate:`, err?.message?.slice(0, 120));
        lastError = err;
      }
    }

    if (!parsedData) {
      logStructuredError('evaluation.allModelsFailed', lastError, { userId: resolvedUserId });

      if (isMockEvaluationAllowed()) {
        await checkAndRecordEvaluationQuota(req, resolvedUserId, authUser.role);
        const mockReport = await createAndPersistMockReport({
          essayText,
          targetBand,
          prompt,
          mode,
          candidateName,
          userId: resolvedUserId,
          timeSpentSeconds: bodyData?.timeSpentSeconds,
          cohortId: bodyData?.cohortId,
          assignmentId: bodyData?.assignmentId,
        });
        return NextResponse.json(mockReport);
      }

      return NextResponse.json(
        {
          error: 'AI_TEMPORARILY_UNAVAILABLE',
          message:
            'The AI examiner service could not complete grading right now. No daily evaluation credit was consumed — please try again shortly.',
        },
        { status: 503 }
      );
    }

    // Consume 1 daily credit atomically ONLY AFTER a genuine validated Gemini evaluation succeeds
    const quotaConsume = await checkAndRecordEvaluationQuota(
      req,
      resolvedUserId,
      authUser.role
    );
    if (!quotaConsume.allowed) {
      return NextResponse.json(
        {
          error: 'DAILY_QUOTA_EXCEEDED',
          message: `You have reached your daily limit of ${quotaConsume.limit} IELTS essay evaluations on the ${quotaConsume.planCode} plan. Quota resets at 00:00 UTC.`,
          planCode: quotaConsume.planCode,
          limit: quotaConsume.limit,
          remaining: 0,
          resetsInHours: quotaConsume.resetsInHours,
          resetsAt: quotaConsume.resetsAt,
        },
        { status: 429 }
      );
    }

    // Calculate official overall band using standard IELTS formula rounding
    const ta = parsedData.layer1ExaminerReport?.taskResponse?.score || 6.5;
    const cc = parsedData.layer1ExaminerReport?.coherenceCohesion?.score || 6.5;
    const lr = parsedData.layer1ExaminerReport?.lexicalResource?.score || 6.5;
    const gra = parsedData.layer1ExaminerReport?.grammaticalAccuracy?.score || 6.5;

    const officialOverall = calculateOverallBandScore(ta, cc, lr, gra);
    parsedData.layer1ExaminerReport.overallBand = officialOverall;
    parsedData.layer2AlignmentReport.achievedBand = officialOverall;
    parsedData.layer2AlignmentReport.sentenceAnnotations = normalizeSentenceAnnotations(
      essayText,
      parsedData.layer2AlignmentReport?.sentenceAnnotations,
      parsedData.layer2AlignmentReport?.specificRecommendations?.lexicalUpgrades
    );

    const finalReport: SubmissionReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...(candidateName ? { candidateName } : {}),
      taskPrompt: prompt,
      essayText,
      wordCount: words,
      targetBandAtSubmission: targetBand,
      modeAtSubmission: mode,
      layer1ExaminerReport: parsedData.layer1ExaminerReport,
      layer2AlignmentReport: parsedData.layer2AlignmentReport
    };

    // Persist report deterministically before returning so /report/[id] never races a timeout
    const persisted = await persistReportSafely(
      finalReport,
      resolvedUserId,
      bodyData?.timeSpentSeconds,
      bodyData?.cohortId,
      bodyData?.assignmentId,
      aiTokensUsed
    );

    return NextResponse.json({
      ...finalReport,
      persisted,
    });
  } catch (error: any) {
    logStructuredError('evaluation.unhandled', error);
    return NextResponse.json(
      {
        error: 'EVALUATION_FAILED',
        message: 'Could not complete essay evaluation. No daily evaluation credit was consumed.',
      },
      { status: 500 }
    );
  }
}
