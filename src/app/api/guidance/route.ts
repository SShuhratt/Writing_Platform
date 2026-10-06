import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateMockSocraticGuidance } from '@/lib/ai-service';

export async function POST(req: Request) {
  let bodyData: any = {};
  try {
    bodyData = await req.json();
    const { essayText, targetBand, prompt } = bodyData;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured on the server, using Socratic engine');
      return NextResponse.json(generateMockSocraticGuidance(essayText, targetBand, prompt));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

    const systemPrompt = `You are the Real-Time Socratic Mentor for an IELTS Writing Assistant Platform.
STRICT PEDAGOGICAL GUARDRAILS:
1. You MUST NOT under any circumstances provide rewritten sentences, ready-to-use phrases, direct replacements, or copy-paste text.
2. Provide ONLY conceptual, instructional, and Socratic guidance. Ask thought-provoking questions to guide the student's own revision.
3. Your feedback MUST strictly reflect the requirements of the selected Target Band Score: Band ${targetBand}.

EVALUATION FOCUS AREAS FOR LIVE WRITING:
- Topic Sentence & Structural Check: Check if paragraph opening sentences have clear discourse markers/transitions.
- 2-Sentence & 30-Word Milestones: Evaluate whether assertions are backed by extending explanations or examples.
- Introduction & Conclusion Checks: Verify thesis statement in Introduction and thesis synthesis in Conclusion.
- Lexical Resource Elevation: Highlight overused simple words and suggest academic register categories.

TASK PROMPT: ${prompt.title} (${prompt.questionText})
CURRENT STUDENT ESSAY:
"""
${essayText}
"""

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
        console.warn(`Model ${modelName} failed in /api/guidance, trying next:`, err?.message?.slice(0, 100));
        lastError = err;
      }
    }

    if (!rawText) {
      console.warn('All external AI models unavailable, engaging intelligent Socratic Guidance fallback');
      return NextResponse.json(generateMockSocraticGuidance(essayText, targetBand, prompt));
    }

    const cleanText = rawText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsedData = JSON.parse(cleanText);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/guidance, falling back to mock Socratic guidance:', error?.message);
    if (bodyData?.essayText && bodyData?.prompt) {
      return NextResponse.json(generateMockSocraticGuidance(bodyData.essayText, bodyData.targetBand || '7.0', bodyData.prompt));
    }
    return NextResponse.json({ error: error?.message || 'Failed to generate guidance' }, { status: 500 });
  }
}
