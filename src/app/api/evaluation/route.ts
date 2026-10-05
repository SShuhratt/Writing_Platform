import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateOverallBandScore } from '@/lib/ielts-rubric';
import { generateMockSubmissionEvaluation } from '@/lib/ai-service';

export async function POST(req: Request) {
  let bodyData: any = {};
  try {
    bodyData = await req.json();
    const { essayText, targetBand, prompt, mode } = bodyData;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using built-in examiner engine');
      return NextResponse.json(generateMockSubmissionEvaluation(essayText, targetBand, prompt, mode));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

    const words = essayText.trim().split(/\s+/).filter(Boolean).length;
    const paragraphs = essayText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);

    const systemPrompt = `You are a Senior IELTS Examiner and Master IELTS Writing Coach.
You must perform an ultra-detailed, highly actionable Dual-Layer Assessment.

STRICT INSTRUCTION: NEVER provide generic boilerplate advice (such as "read more", "practice under timed conditions", or referring to "Body Paragraph 2" if the student did not write one!).
All feedback, lexical suggestions, grammatical boosters, and roadmap steps MUST be explicitly tailored to the candidate's actual text, word count, and paragraphing.

DRAFT METRICS:
- Submitted Words: ${words} (Minimum Required: ${prompt.minWordCount})
- Detected Paragraphs: ${paragraphs.length} (Standard IELTS Structure: 4 paragraphs)
- Target Band: ${targetBand}
- Prompt: "${prompt.title}" — ${prompt.questionText}
- Candidate Draft:
"""
${essayText}
"""

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
    - paragraphCountAudit: detected (${paragraphs.length}), recommended (4), breakdownNote.
    - recommendedBlueprint: 4 bullet points outlining Introduction (Hook + Thesis), Body Paragraph 1 (PEEL framework), Body Paragraph 2 (Counter-argument / alternative with PEEL), and Conclusion.
  * lexicalUpgrades: 2 to 3 items extracting ACTUAL words/phrases from candidate's text (or common simplistic expressions used) with 2-4 academic collocations (Band 7.5-9.0) and pedagogical context showing how to use them.
  * grammarBoosters: 2 advanced grammatical structures (e.g. Inverted Conditional, Concessive Dependent Clause, Cleft Sentence, Fronted Adverbial) with syntactic pattern formula, a concrete sentence tailored specifically to this prompt, and examiner rationale.

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
          "Paragraph 1 (Introduction): ...",
          "Paragraph 2 (Body 1): ...",
          "Paragraph 3 (Body 2): ...",
          "Paragraph 4 (Conclusion): ..."
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
    }
  }
}`;

    let rawText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent(systemPrompt);
        rawText = result.response.text();
        if (rawText) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed in /api/evaluation, trying next candidate:`, err?.message?.slice(0, 100));
        lastError = err;
      }
    }

    if (!rawText) {
      console.warn('All external AI models unavailable, engaging intelligent Examiner Assessment Engine fallback');
      return NextResponse.json(generateMockSubmissionEvaluation(essayText, targetBand, prompt, mode));
    }

    const cleanText = rawText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsedData = JSON.parse(cleanText);

    // Calculate official overall band using standard IELTS formula rounding
    const ta = parsedData.layer1ExaminerReport?.taskResponse?.score || 6.5;
    const cc = parsedData.layer1ExaminerReport?.coherenceCohesion?.score || 6.5;
    const lr = parsedData.layer1ExaminerReport?.lexicalResource?.score || 6.5;
    const gra = parsedData.layer1ExaminerReport?.grammaticalAccuracy?.score || 6.5;

    const officialOverall = calculateOverallBandScore(ta, cc, lr, gra);
    parsedData.layer1ExaminerReport.overallBand = officialOverall;
    parsedData.layer2AlignmentReport.achievedBand = officialOverall;

    return NextResponse.json({
      id: `report-${Date.now()}`,
      timestamp: Date.now(),
      taskPrompt: prompt,
      essayText,
      wordCount: words,
      targetBandAtSubmission: targetBand,
      modeAtSubmission: mode,
      layer1ExaminerReport: parsedData.layer1ExaminerReport,
      layer2AlignmentReport: parsedData.layer2AlignmentReport
    });
  } catch (error: any) {
    console.error('Error in /api/evaluation, falling back to examiner engine:', error?.message);
    if (bodyData?.essayText && bodyData?.prompt) {
      return NextResponse.json(
        generateMockSubmissionEvaluation(
          bodyData.essayText,
          bodyData.targetBand || '7.0',
          bodyData.prompt,
          bodyData.mode || 'ACTIVE_ASSISTANT'
        )
      );
    }
    return NextResponse.json({ error: error?.message || 'Failed to complete evaluation' }, { status: 500 });
  }
}
