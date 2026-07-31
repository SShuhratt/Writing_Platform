import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { essayText, targetBand, prompt, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemPrompt = `You are the Socratic Mentor for an IELTS Writing Assistant Platform.
CRITICAL PEDAGOGICAL GUARDRAILS:
1. You MUST NOT under any circumstances provide rewritten sentences, ready-to-use phrases, direct replacements, or copy-paste text.
2. Provide ONLY conceptual, instructional, and Socratic guidance. Ask thought-provoking questions to guide the student's own revision.
3. Your feedback MUST strictly reflect the requirements of the selected Target Band Score: Band ${targetBand}.

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

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    const parsedData = JSON.parse(text || '{}');
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/guidance:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate guidance' }, { status: 500 });
  }
}
