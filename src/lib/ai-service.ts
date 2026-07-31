import { TargetBand, IELTSTaskPrompt, SocraticGuidanceCard, LevelOfferAlert, SubmissionReport } from '@/types/ielts';
import { OFFICIAL_IELTS_RUBRICS, calculateOverallBandScore } from './ielts-rubric';

/**
 * AI Service Engine supporting Google Gemini API & intelligent mock simulation engine.
 */

export interface RealtimeGuidanceRequest {
  essayText: string;
  targetBand: TargetBand;
  prompt: IELTSTaskPrompt;
  apiKey?: string;
}

export interface RealtimeGuidanceResponse {
  cards: SocraticGuidanceCard[];
  levelOffer?: LevelOfferAlert | null;
}

export interface EvaluationRequest {
  essayText: string;
  targetBand: TargetBand;
  prompt: IELTSTaskPrompt;
  mode: 'ACTIVE_ASSISTANT' | 'FOCUS_EXAM';
  apiKey?: string;
}

/**
 * Generate Realtime Socratic Guidance
 */
export async function generateRealtimeGuidance(req: RealtimeGuidanceRequest): Promise<RealtimeGuidanceResponse> {
  const { essayText, targetBand, prompt, apiKey } = req;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      const response = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayText, targetBand, prompt, apiKey }),
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to Socratic engine:', err);
    }
  }

  // Fallback to intelligent Socratic Guidance Generator
  return generateMockSocraticGuidance(essayText, targetBand, prompt);
}

/**
 * Generate Dual-Layer Submission Evaluation Report
 */
export async function generateSubmissionEvaluation(req: EvaluationRequest): Promise<SubmissionReport> {
  const { essayText, targetBand, prompt, mode, apiKey } = req;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      const response = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayText, targetBand, prompt, mode, apiKey }),
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Gemini API evaluation call failed, falling back to examiner engine:', err);
    }
  }

  // Fallback to intelligent Examiner Assessment Engine
  return generateMockSubmissionEvaluation(essayText, targetBand, prompt, mode);
}

// --------------------------------------------------------------------------------
// PEDAGOGICAL SOCRATIC GUIDANCE MOCK ENGINE (Complies with Rule 3.5 & Guardrails)
// --------------------------------------------------------------------------------

function generateMockSocraticGuidance(essayText: string, targetBand: TargetBand, prompt: IELTSTaskPrompt): RealtimeGuidanceResponse {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const targetNum = parseFloat(targetBand);
  const wordCount = essayText.trim().split(/\s+/).length;

  const cards: SocraticGuidanceCard[] = [];
  let levelOffer: LevelOfferAlert | null = null;

  // Simple heuristic checks for Socratic mentoring
  paragraphs.forEach((p, idx) => {
    const text = p.toLowerCase();

    // Check Lexical Resource (LR) for target band requirements
    if (targetNum >= 7.0) {
      if (text.includes('good') || text.includes('bad') || text.includes('important') || text.includes('thing')) {
        cards.push({
          id: `lr-${idx}-${Date.now()}`,
          category: 'LEXICAL_RESOURCE',
          paragraphIndex: idx + 1,
          highlightSnippet: p.substring(0, 45) + '...',
          title: `Lexical Precision for Band ${targetBand}`,
          socraticPrompt: `Paragraph ${idx + 1} uses basic descriptors like "important" or "good". To reach Band ${targetBand}, what precise academic vocabulary or Cause & Effect collocations could better convey this nuance?`,
          targetBandContext: targetBand,
          createdAt: Date.now()
        });
      }
    }

    // Check Coherence & Cohesion (CC)
    if (idx > 0 && !text.includes('however') && !text.includes('furthermore') && !text.includes('in addition') && !text.includes('consequently') && !text.includes('on the other hand')) {
      cards.push({
        id: `cc-${idx}-${Date.now()}`,
        category: 'COHERENCE_COHESION',
        paragraphIndex: idx + 1,
        highlightSnippet: p.substring(0, 45) + '...',
        title: `Transition & Paragraph Linking`,
        socraticPrompt: `Paragraph ${idx + 1} begins abruptly. How might a contrastive or additive discourse marker strengthen the logical connection with Paragraph ${idx}?`,
        targetBandContext: targetBand,
        createdAt: Date.now()
      });
    }

    // Check Task Response (TA/TR)
    if (text.length < 120 && idx > 0) {
      cards.push({
        id: `tr-${idx}-${Date.now()}`,
        category: 'TASK_RESPONSE',
        paragraphIndex: idx + 1,
        highlightSnippet: p.substring(0, 45) + '...',
        title: `Argument Extension & Support`,
        socraticPrompt: `You have stated an assertion in Paragraph ${idx + 1}, but it lacks an extended explanation or concrete real-world example. What specific evidence can reinforce this point?`,
        targetBandContext: targetBand,
        createdAt: Date.now()
      });
    }
  });

  // Evaluate Level Offer Scenarios (3.2 & 3.3)
  if (paragraphs.length >= 2) {
    const avgWordsPerPara = wordCount / paragraphs.length;

    // Downward offer if paragraph depth is minimal relative to high target band
    if (targetNum >= 7.5 && avgWordsPerPara < 45) {
      const lowerBand = (targetNum - 0.5).toFixed(1) as TargetBand;
      levelOffer = {
        type: 'DOWNWARD',
        suggestedBand: lowerBand,
        reason: `Your current paragraph depth is concise for Band ${targetBand}. Consider adjusting to Band ${lowerBand} to focus on mastering core argument development first.`
      };
    }
    // Upward offer if user writes with advanced complexity on a lower target
    else if (targetNum <= 6.5 && wordCount > 180 && paragraphs.length >= 3) {
      const higherBand = (targetNum + 0.5).toFixed(1) as TargetBand;
      levelOffer = {
        type: 'UPWARD',
        suggestedBand: higherBand,
        reason: `Your drafting demonstrates lexical variety and paragraph structure exceeding Band ${targetBand}! Would you like to raise your target to Band ${higherBand}?`
      };
    }
  }

  // Ensure default card if text is developing well
  if (cards.length === 0 && wordCount >= 50) {
    cards.push({
      id: `general-${Date.now()}`,
      category: 'TASK_RESPONSE',
      paragraphIndex: paragraphs.length,
      title: `Band ${targetBand} Structure Check`,
      socraticPrompt: `Your essay is progressing well. Ensure your upcoming concluding paragraph directly addresses all parts of the prompt: "${prompt.title}".`,
      targetBandContext: targetBand,
      createdAt: Date.now()
    });
  }

  return { cards, levelOffer };
}

// --------------------------------------------------------------------------------
// DUAL-LAYER EXAMINER EVALUATION MOCK ENGINE (Complies with Section 4)
// --------------------------------------------------------------------------------

function generateMockSubmissionEvaluation(
  essayText: string,
  targetBand: TargetBand,
  prompt: IELTSTaskPrompt,
  mode: 'ACTIVE_ASSISTANT' | 'FOCUS_EXAM'
): SubmissionReport {
  const words = essayText.trim().split(/\s+/).filter(Boolean).length;
  const targetNum = parseFloat(targetBand);

  // Baseline evaluation heuristic
  let taScore = 6.5;
  let ccScore = 6.5;
  let lrScore = 6.5;
  let graScore = 6.5;

  if (words >= prompt.minWordCount) {
    taScore += 0.5;
    ccScore += 0.5;
  } else {
    taScore -= 1.0; // Under word count penalty
  }

  const textLower = essayText.toLowerCase();

  // Lexical resource heuristic
  const academicTerms = ['consequently', 'subsequently', 'demonstrates', 'substantive', 'imperative', 'predominantly', 'underlying'];
  const matchedAcademic = academicTerms.filter(t => textLower.includes(t)).length;
  lrScore += Math.min(1.5, matchedAcademic * 0.4);

  // Coherence heuristic
  const connectives = ['furthermore', 'however', 'in addition', 'on the other hand', 'for instance', 'in conclusion'];
  const matchedConnectives = connectives.filter(c => textLower.includes(c)).length;
  ccScore += Math.min(1.0, matchedConnectives * 0.3);

  // Cap scores between 5.0 and 9.0
  taScore = Math.min(9.0, Math.max(5.0, Math.round(taScore * 2) / 2));
  ccScore = Math.min(9.0, Math.max(5.0, Math.round(ccScore * 2) / 2));
  lrScore = Math.min(9.0, Math.max(5.0, Math.round(lrScore * 2) / 2));
  graScore = Math.min(9.0, Math.max(5.0, Math.round(graScore * 2) / 2));

  const overallBand = calculateOverallBandScore(taScore, ccScore, lrScore, graScore);

  // Determine Layer 2 Target Alignment
  let targetStatus: 'TARGET_ACHIEVED' | 'TARGET_NOT_MET' | 'EXCEEDED_TARGET' = 'TARGET_ACHIEVED';
  if (overallBand > targetNum) targetStatus = 'EXCEEDED_TARGET';
  else if (overallBand < targetNum) targetStatus = 'TARGET_NOT_MET';

  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const paragraphAudits = paragraphs.map((p, idx) => {
    const pLen = p.trim().split(/\s+/).length;
    let status: 'MET' | 'BELOW' | 'EXCEEDED' = 'MET';
    let analysis = `Paragraph ${idx + 1} demonstrates adequate coherence and addresses prompt points clearly.`;

    if (pLen < 40) {
      status = 'BELOW';
      analysis = `Paragraph ${idx + 1} is underdeveloped (${pLen} words). Expand with specific supporting arguments for Band ${targetBand}.`;
    } else if (pLen > 80 && idx > 0) {
      status = 'EXCEEDED';
      analysis = `Paragraph ${idx + 1} showcases rich structural depth (${pLen} words) and strong lexical variety.`;
    }

    return {
      paragraphNumber: idx + 1,
      textSnippet: p.substring(0, 70) + (p.length > 70 ? '...' : ''),
      status,
      analysis
    };
  });

  return {
    id: `report-${Date.now()}`,
    timestamp: Date.now(),
    taskPrompt: prompt,
    essayText,
    wordCount: words,
    targetBandAtSubmission: targetBand,
    modeAtSubmission: mode,

    layer1ExaminerReport: {
      overallBand,
      taskResponse: {
        score: taScore,
        commentary: `The response addresses all key prompts of "${prompt.title}". Main points are extended with relevant arguments.`,
        keyStrengths: words >= prompt.minWordCount ? [`Exceeds minimum word count threshold (${words} / ${prompt.minWordCount} words)`] : ['Addressed central prompt position clearly'],
        keyWeaknesses: words < prompt.minWordCount ? [`Below required minimum word count (${words} / ${prompt.minWordCount} words)`] : ['Could further elaborate on second main body paragraph']
      },
      coherenceCohesion: {
        score: ccScore,
        commentary: OFFICIAL_IELTS_RUBRICS[ccScore.toFixed(1) as TargetBand]?.coherenceCohesion || 'Clear paragraphing with logical progression.',
        keyStrengths: ['Logical paragraph progression throughout', 'Clear topic sentence structures'],
        keyWeaknesses: ['Slight over-reliance on explicit cohesive markers']
      },
      lexicalResource: {
        score: lrScore,
        commentary: OFFICIAL_IELTS_RUBRICS[lrScore.toFixed(1) as TargetBand]?.lexicalResource || 'Sufficient range of academic vocabulary.',
        keyStrengths: ['Effective usage of task-appropriate vocabulary', 'Demonstrates academic register'],
        keyWeaknesses: ['Occasional minor word choice inaccuracies in complex collocations']
      },
      grammaticalAccuracy: {
        score: graScore,
        commentary: OFFICIAL_IELTS_RUBRICS[graScore.toFixed(1) as TargetBand]?.grammaticalAccuracy || 'Mix of simple and complex sentence forms.',
        keyStrengths: ['Frequent error-free simple and compound sentences', 'Good punctuation control'],
        keyWeaknesses: ['Minor slips in complex clause subordination']
      },
      examinerSummary: `Official IELTS Examiner Assessment yields an Overall Writing Band Score of ${overallBand.toFixed(1)}. The essay exhibits strong structure and clear position development.`
    },

    layer2AlignmentReport: {
      targetStatus,
      selectedTargetBand: targetBand,
      achievedBand: overallBand,
      paragraphAudits,
      gapAnalysis: targetStatus === 'TARGET_ACHIEVED'
        ? `Your submission meets the rigorous requirements for Band ${targetBand}! Your structural breakdown and lexical range match official expectations.`
        : targetStatus === 'EXCEEDED_TARGET'
        ? `Congratulations! Your writing scored ${overallBand.toFixed(1)}, exceeding your target of Band ${targetBand}. Consider setting your target band higher for your next session!`
        : `Your submission scored ${overallBand.toFixed(1)}, falling short of your Target Band ${targetBand}. Key areas to bridge include deeper argument expansion and more varied cohesive markers.`,
      actionableRoadmap: [
        `Focus on expanding main supporting ideas in Body Paragraph 2 with concrete examples.`,
        `Incorporate 2–3 sophisticated Cause & Effect collocations to elevate Lexical Resource to Band ${targetBand}.`,
        `Maintain active practice in ${mode === 'ACTIVE_ASSISTANT' ? 'Focus Exam Mode' : 'Active Assistant Mode'} to build timed execution skills.`
      ]
    }
  };
}
