import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateOverallBandScore } from '@/lib/ielts-rubric';

export async function POST(req: Request) {
  try {
    const { essayText, targetBand, prompt, mode, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemPrompt = `You are an official Senior IELTS Examiner grading an essay.
You must perform a Dual-Layer Assessment:

LAYER 1: Objective Examiner Band Score (1.0 to 9.0 independent of target choice) across:
- Task Achievement / Task Response
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

LAYER 2: Target Alignment & Gap Analysis Report relative to selected Target Band ${targetBand}:
- Target Status ("TARGET_ACHIEVED", "TARGET_NOT_MET", or "EXCEEDED_TARGET")
- Paragraph-by-paragraph audit (MET, BELOW, EXCEEDED)
- Actionable step-by-step improvement roadmap

TASK PROMPT: ${prompt.title} (${prompt.questionText})
MODE USED: ${mode}
SELECTED TARGET BAND: ${targetBand}
ESSAY TEXT:
"""
${essayText}
"""

Respond with valid JSON matching this schema:
{
  "layer1ExaminerReport": {
    "overallBand": number (1.0 - 9.0),
    "taskResponse": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "coherenceCohesion": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "lexicalResource": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "grammaticalAccuracy": { "score": number, "commentary": "text", "keyStrengths": ["text"], "keyWeaknesses": ["text"] },
    "examinerSummary": "Overall summary of student writing performance"
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
        "analysis": "alignment commentary"
      }
    ],
    "gapAnalysis": "Comprehensive gap analysis text",
    "actionableRoadmap": ["Step 1", "Step 2", "Step 3"]
  }
}`;

    const result = await model.generateContent(systemPrompt);
    const rawText = result.response.text();
    const cleanText = (rawText || '{}').replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsedData = JSON.parse(cleanText);

    // Calculate official overall band using standard IELTS formula rounding
    const ta = parsedData.layer1ExaminerReport?.taskResponse?.score || 6.5;
    const cc = parsedData.layer1ExaminerReport?.coherenceCohesion?.score || 6.5;
    const lr = parsedData.layer1ExaminerReport?.lexicalResource?.score || 6.5;
    const gra = parsedData.layer1ExaminerReport?.grammaticalAccuracy?.score || 6.5;

    const officialOverall = calculateOverallBandScore(ta, cc, lr, gra);
    parsedData.layer1ExaminerReport.overallBand = officialOverall;
    parsedData.layer2AlignmentReport.achievedBand = officialOverall;

    const words = essayText.trim().split(/\s+/).filter(Boolean).length;

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
    console.error('Error in /api/evaluation:', error);
    return NextResponse.json({ error: error?.message || 'Failed to complete evaluation' }, { status: 500 });
  }
}
