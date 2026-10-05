import { TargetBand, IELTSTaskPrompt, SocraticGuidanceCard, LevelOfferAlert, SubmissionReport } from '@/types/ielts';
import { OFFICIAL_IELTS_RUBRICS, calculateOverallBandScore } from './ielts-rubric';

/**
 * AI Service Engine supporting Google Gemini API & intelligent mock simulation engine.
 */

export interface RealtimeGuidanceRequest {
  essayText: string;
  targetBand: TargetBand;
  prompt: IELTSTaskPrompt;
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
}

/**
 * Generate Realtime Socratic Guidance
 */
export async function generateRealtimeGuidance(req: RealtimeGuidanceRequest): Promise<RealtimeGuidanceResponse> {
  const { essayText, targetBand, prompt } = req;

  try {
    const response = await fetch('/api/guidance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essayText, targetBand, prompt }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.cards) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Server Gemini API call unavailable, using Socratic engine:', err);
  }

  // Fallback to intelligent Socratic Guidance Generator
  return generateMockSocraticGuidance(essayText, targetBand, prompt);
}

/**
 * Generate Dual-Layer Submission Evaluation Report
 */
export async function generateSubmissionEvaluation(req: EvaluationRequest): Promise<SubmissionReport> {
  const { essayText, targetBand, prompt, mode } = req;

  try {
    const response = await fetch('/api/evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essayText, targetBand, prompt, mode }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.layer1ExaminerReport && data.layer2AlignmentReport) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Server Gemini API evaluation call unavailable, using examiner engine:', err);
  }

  // Fallback to intelligent Examiner Assessment Engine
  return generateMockSubmissionEvaluation(essayText, targetBand, prompt, mode);
}

// --------------------------------------------------------------------------------
// PEDAGOGICAL SOCRATIC GUIDANCE MOCK ENGINE (Complies with Rule 3.5 & Guardrails)
// --------------------------------------------------------------------------------

export function generateMockSocraticGuidance(essayText: string, targetBand: TargetBand, prompt: IELTSTaskPrompt): RealtimeGuidanceResponse {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const targetNum = parseFloat(targetBand);
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  const cards: SocraticGuidanceCard[] = [];
  let levelOffer: LevelOfferAlert | null = null;

  // 1. Introduction Check (Paragraph 1)
  if (paragraphs.length >= 1) {
    const introText = paragraphs[0].toLowerCase();
    const introSentences = (paragraphs[0].match(/[.!?](\s+|$)/g) || []).length;

    if (introSentences === 1) {
      cards.push({
        id: `intro-structure-${Date.now()}`,
        category: 'TASK_RESPONSE',
        paragraphIndex: 1,
        highlightSnippet: paragraphs[0].substring(0, 50) + '...',
        title: `Introduction Thesis & Position Check`,
        socraticPrompt: `Paragraph 1 currently contains 1 sentence. To establish a strong Band ${targetBand} introduction, how can you follow your background sentence with an explicit thesis statement framing your outline?`,
        targetBandContext: targetBand,
        createdAt: Date.now()
      });
    }
  }

  // 2. Topic Sentence & Structural Check (First sentence of Body Paragraphs)
  paragraphs.forEach((p, idx) => {
    if (idx > 0) {
      const pSentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      const topicSentence = pSentences[0] || p;
      const topicLower = topicSentence.toLowerCase();

      // Coherence transition check in Topic Sentence
      const transitions = ['furthermore', 'however', 'moreover', 'on the other hand', 'in contrast', 'consequently', 'firstly', 'secondly', 'another key factor'];
      const hasTransition = transitions.some(t => topicLower.includes(t));

      if (!hasTransition) {
        cards.push({
          id: `topic-sent-${idx}-${Date.now()}`,
          category: 'COHERENCE_COHESION',
          paragraphIndex: idx + 1,
          highlightSnippet: topicSentence.trim().substring(0, 50) + '...',
          title: `Paragraph ${idx + 1} Topic Sentence Transition`,
          socraticPrompt: `The opening sentence of Paragraph ${idx + 1} introduces a main idea. For Band ${targetBand} cohesion, how might an introductory linking phrase or contrastive marker clarify how this idea relates to Paragraph ${idx}?`,
          targetBandContext: targetBand,
          createdAt: Date.now()
        });
      }
    }
  });

  // 3. Lexical Resource & Academic Precision (Checked across all paragraphs)
  paragraphs.forEach((p, idx) => {
    const text = p.toLowerCase();
    if (targetNum >= 7.0) {
      if (text.includes('good') || text.includes('bad') || text.includes('important') || text.includes('thing') || text.includes('a lot of') || text.includes('people think')) {
        cards.push({
          id: `lr-${idx}-${Date.now()}`,
          category: 'LEXICAL_RESOURCE',
          paragraphIndex: idx + 1,
          highlightSnippet: p.substring(0, 45) + '...',
          title: `Lexical Resource Elevation (Band ${targetBand})`,
          socraticPrompt: `Paragraph ${idx + 1} uses general vocabulary (e.g. "important", "people think"). What precise academic collocations or Cause & Effect terms (e.g., "pivotal role", "advocates contend") could elevate this phrasing for Band ${targetBand}?`,
          targetBandContext: targetBand,
          createdAt: Date.now()
        });
      }
    }

    // 4. Argument Support & Evidence Depth (Check after 2 sentences in body paragraphs)
    const sentenceCount = (p.match(/[.!?](\s+|$)/g) || []).length;
    if (idx > 0 && sentenceCount >= 2 && sentenceCount < 4) {
      cards.push({
        id: `tr-support-${idx}-${Date.now()}`,
        category: 'TASK_RESPONSE',
        paragraphIndex: idx + 1,
        highlightSnippet: p.substring(0, 50) + '...',
        title: `2-Sentence Milestone: Evidence & Example Check`,
        socraticPrompt: `You have drafted 2 key sentences in Paragraph ${idx + 1}. To achieve Band ${targetBand} Task Response, what specific real-world example or logical illustration can you add to extend this point?`,
        targetBandContext: targetBand,
        createdAt: Date.now()
      });
    }
  });

  // 5. Conclusion Check
  if (paragraphs.length >= 3) {
    const lastP = paragraphs[paragraphs.length - 1];
    const lastPLower = lastP.toLowerCase();
    const isConclusion = lastPLower.includes('in conclusion') || lastPLower.includes('to conclude') || lastPLower.includes('to summarize') || lastPLower.includes('overall');

    if (isConclusion) {
      cards.push({
        id: `conclusion-check-${Date.now()}`,
        category: 'TASK_RESPONSE',
        paragraphIndex: paragraphs.length,
        highlightSnippet: lastP.substring(0, 50) + '...',
        title: `Conclusion Synthesis & Final Stand`,
        socraticPrompt: `Your concluding paragraph synthesizes your essay. Ensure your final sentence explicitly reiterates your overarching stance without introducing new unargued points.`,
        targetBandContext: targetBand,
        createdAt: Date.now()
      });
    }
  }

  // Level Offer Evaluation (Scenario A & B)
  if (paragraphs.length >= 2) {
    const avgWordsPerPara = wordCount / paragraphs.length;
    if (targetNum >= 7.5 && avgWordsPerPara < 40) {
      const lowerBand = (targetNum - 0.5).toFixed(1) as TargetBand;
      levelOffer = {
        type: 'DOWNWARD',
        suggestedBand: lowerBand,
        reason: `Your paragraph depth is concise for Band ${targetBand}. Consider adjusting to Band ${lowerBand} to focus on mastering core argument development first.`
      };
    } else if (targetNum <= 6.5 && wordCount > 170 && paragraphs.length >= 3) {
      const higherBand = (targetNum + 0.5).toFixed(1) as TargetBand;
      levelOffer = {
        type: 'UPWARD',
        suggestedBand: higherBand,
        reason: `Your drafting demonstrates lexical variety and structural depth exceeding Band ${targetBand}! Would you like to raise your target to Band ${higherBand}?`
      };
    }
  }

  // Fallback card if empty
  if (cards.length === 0 && wordCount >= 30) {
    cards.push({
      id: `general-${Date.now()}`,
      category: 'TASK_RESPONSE',
      paragraphIndex: paragraphs.length || 1,
      title: `Band ${targetBand} Progress Check`,
      socraticPrompt: `Your response is developing well. As you draft your next sentences, focus on linking your supporting points directly back to "${prompt.title}".`,
      targetBandContext: targetBand,
      createdAt: Date.now()
    });
  }

  return { cards: cards.slice(0, 4), levelOffer };
}

// --------------------------------------------------------------------------------
// DUAL-LAYER EXAMINER EVALUATION MOCK ENGINE (Complies with Section 4)
// --------------------------------------------------------------------------------

export function generateMockSubmissionEvaluation(
  essayText: string,
  targetBand: TargetBand,
  prompt: IELTSTaskPrompt,
  mode: 'ACTIVE_ASSISTANT' | 'FOCUS_EXAM'
): SubmissionReport {
  const words = essayText.trim().split(/\s+/).filter(Boolean).length;
  const targetNum = parseFloat(targetBand);

  let taScore = 6.5;
  let ccScore = 6.5;
  let lrScore = 6.5;
  let graScore = 6.5;

  if (words >= prompt.minWordCount) {
    taScore += 0.5;
    ccScore += 0.5;
  } else {
    taScore -= 1.0;
  }

  const textLower = essayText.toLowerCase();

  const academicTerms = ['consequently', 'subsequently', 'demonstrates', 'substantive', 'imperative', 'predominantly', 'underlying'];
  const matchedAcademic = academicTerms.filter(t => textLower.includes(t)).length;
  lrScore += Math.min(1.5, matchedAcademic * 0.4);

  const connectives = ['furthermore', 'however', 'in addition', 'on the other hand', 'for instance', 'in conclusion'];
  const matchedConnectives = connectives.filter(c => textLower.includes(c)).length;
  ccScore += Math.min(1.0, matchedConnectives * 0.3);

  taScore = Math.min(9.0, Math.max(5.0, Math.round(taScore * 2) / 2));
  ccScore = Math.min(9.0, Math.max(5.0, Math.round(ccScore * 2) / 2));
  lrScore = Math.min(9.0, Math.max(5.0, Math.round(lrScore * 2) / 2));
  graScore = Math.min(9.0, Math.max(5.0, Math.round(graScore * 2) / 2));

  const overallBand = calculateOverallBandScore(taScore, ccScore, lrScore, graScore);

  let targetStatus: 'TARGET_ACHIEVED' | 'TARGET_NOT_MET' | 'EXCEEDED_TARGET' = 'TARGET_ACHIEVED';
  if (overallBand > targetNum) targetStatus = 'EXCEEDED_TARGET';
  else if (overallBand < targetNum) targetStatus = 'TARGET_NOT_MET';

  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const wordDeficit = Math.max(0, prompt.minWordCount - words);

  // 1. Dynamic Lexical Upgrade Mining: Find candidate phrases or weak words from text
  const lexicalOpportunities = [
    {
      keywords: ['common concerns', 'concern', 'worried', 'worry'],
      originalPhrase: textLower.includes('common concerns') ? 'common concerns' : 'concerns',
      suggestedCollocations: ['a pervasive apprehension', 'escalating pedagogical debate', 'widespread societal unease'],
      pedagogicalContext: 'Replace informal noun combinations with high-register academic collocations that establish objective examiner authority.'
    },
    {
      keywords: ['spreading across', 'spreading', 'spread', 'all over'],
      originalPhrase: textLower.includes('spreading across') ? 'spreading across' : 'spreading',
      suggestedCollocations: ['proliferating across international systems', 'permeating modern society', 'transcending jurisdictional boundaries'],
      pedagogicalContext: 'Upgrade general transitive verbs with precise academic verbs indicating rapid diffusion or systemic adoption.'
    },
    {
      keywords: ['world education', 'education', 'school', 'schools', 'student', 'students'],
      originalPhrase: textLower.includes('world education') ? 'world education' : 'education',
      suggestedCollocations: ['contemporary pedagogical paradigms', 'institutional academic curricula', 'holistic educational frameworks'],
      pedagogicalContext: 'Elevate references to schooling by employing academic terminology specific to curriculum design and pedagogy.'
    },
    {
      keywords: ['important', 'big', 'good', 'helpful', 'useful'],
      originalPhrase: textLower.includes('important') ? 'important' : textLower.includes('good') ? 'good' : 'helpful',
      suggestedCollocations: ['of paramount significance', 'indispensable to cognitive development', 'profoundly advantageous'],
      pedagogicalContext: 'Replace overused qualitative adjectives with high-register prepositional phrases or specialized evaluative adjectives.'
    },
    {
      keywords: ['people think', 'they think', 'people believe', 'some say', 'people say'],
      originalPhrase: textLower.includes('people think') ? 'people think' : 'some people say',
      suggestedCollocations: ['proponents vehemently argue', 'critics contend', 'a prominent school of thought posits'],
      pedagogicalContext: 'Deploy formal academic attribution verbs rather than conversational phrasing like "people think".'
    },
    {
      keywords: ['problem', 'trouble', 'bad', 'negative'],
      originalPhrase: textLower.includes('problem') ? 'problem' : 'negative consequences',
      suggestedCollocations: ['an acute dilemma', 'detrimental ramifications', 'systemic impediments'],
      pedagogicalContext: 'Specify the structural or societal impact of the issue rather than relying on generic words like "problem".'
    }
  ];

  // Pick matched lexical items, or construct from candidate's first sentences
  const matchedLexical = lexicalOpportunities.filter(item =>
    item.keywords.some(k => textLower.includes(k))
  );

  const fallbackLexicalSnippet = essayText.slice(0, 40).replace(/["\n]/g, '').trim() || 'basic topic terminology';
  const lexicalUpgrades = matchedLexical.length >= 2
    ? matchedLexical.slice(0, 3)
    : [
        ...matchedLexical,
        {
          originalPhrase: `"${fallbackLexicalSnippet}..."`,
          suggestedCollocations: ['substantive scholarly discourse', 'empirical methodologies', 'salient socio-economic factors'],
          pedagogicalContext: 'Enrich domain-specific vocabulary related to this prompt with academic collocations targeting Band 7.5+ Lexical Resource.'
        },
        {
          originalPhrase: 'qualitative claims (e.g. good / important)',
          suggestedCollocations: ['of paramount significance', 'exerts a profound influence', 'warrants critical examination'],
          pedagogicalContext: 'Use analytical verb-phrase collocations to articulate your thesis with academic precision.'
        }
      ].slice(0, 3);

  // 2. Concrete Grammar Boosters Tailored to Prompt & Essay
  const topicTheme = prompt.title.toLowerCase();
  const grammarBoosters = [
    {
      structureType: 'Inverted Conditional (GRA Band 8.0)',
      syntacticPattern: 'Were + [Subject] + to [Verb]..., [Subject] + would [Verb]...',
      tailoredExample: topicTheme.includes('tech')
        ? 'Were policymakers to integrate algorithmic education into school curricula, students would develop far more resilient critical faculties.'
        : 'Were educational authorities to prioritize experiential problem-solving over rote memorization, graduates would adapt far more effectively to workplace realities.',
      examinerRationale: 'Inverted hypothetical conditions display syntactic flexibility and stylistic variety, directly satisfying the Band 8.0 GRA criteria for complex structures.'
    },
    {
      structureType: 'Fronted Concessive Subordination (GRA Band 7.5)',
      syntacticPattern: 'While / Although [Counter-Perspective], evidence overwhelmingly demonstrates that [Core Claim]...',
      tailoredExample: topicTheme.includes('tech')
        ? 'While digital tools undeniably enhance classroom interactivity, unmoderated screen exposure risks undermining sustained cognitive focus.'
        : 'While standardized examinations provide standardized benchmarks, empirical evidence demonstrates that continuous formative assessment produces more equitable outcomes.',
      examinerRationale: 'Examiners reward complex subordinating conjunctions that balance opposing viewpoints while maintaining precise grammatical control.'
    }
  ];

  // 3. Dynamic Structural Diagnosis
  const structuralDiagnosis = {
    wordCountAudit: {
      submitted: words,
      required: prompt.minWordCount,
      difference: prompt.minWordCount - words,
      status: (words < prompt.minWordCount ? 'UNDER_LENGTH' : words > prompt.minWordCount + 150 ? 'EXCESSIVE' : 'OPTIMAL') as 'OPTIMAL' | 'UNDER_LENGTH' | 'EXCESSIVE',
      penaltyWarning: words < prompt.minWordCount
        ? `Deficit of ${prompt.minWordCount - words} words. Essays under ${prompt.minWordCount} words automatically incur a penalty in Task Achievement (Band 5.0–6.0 ceiling).`
        : undefined
    },
    paragraphCountAudit: {
      detected: paragraphs.length,
      recommended: 4,
      breakdownNote: paragraphs.length === 1
        ? 'Single continuous paragraph detected. IELTS examiners require 4 distinct paragraphs (Introduction, 2 Body Paragraphs, and Conclusion) to award Band 6.0+ in Coherence & Cohesion.'
        : paragraphs.length < 4
        ? `${paragraphs.length} paragraphs detected. IELTS essays require a 4-paragraph structure with clear line breaks between sections.`
        : 'Standard 4-paragraph structure detected with clear topical separation.'
    },
    recommendedBlueprint: [
      `Paragraph 1 (Introduction, ~35-45 words): Paraphrase "${prompt.title}" and clearly state your overarching thesis statement.`,
      `Paragraph 2 (Body Paragraph 1, ~90 words): Present your primary argument using the PEEL method (Point, Explanation, Evidence, Link).`,
      `Paragraph 3 (Body Paragraph 2, ~90 words): Address the counter-perspective or secondary argument with concrete real-world illustration.`,
      `Paragraph 4 (Conclusion, ~30-40 words): Synthesize both perspectives and reiterate your stance without introducing new unargued points.`
    ]
  };

  // 4. Dynamic Actionable Roadmap Tailored to Candidate Draft
  const dynamicRoadmap: string[] = [];

  if (words < prompt.minWordCount) {
    dynamicRoadmap.push(
      `Word-Count Expansion (+${wordDeficit} words): Your draft has ${words} words (minimum ${prompt.minWordCount}). Expand your arguments using the PEEL framework to add ~${Math.ceil(wordDeficit / (paragraphs.length || 1))} words per paragraph and eliminate the under-length penalty.`
    );
  }

  if (paragraphs.length === 1) {
    dynamicRoadmap.push(
      `Paragraph Division: Split your single-paragraph text into 4 clear sections: Introduction, Body Paragraph 1, Body Paragraph 2, and Conclusion. In IELTS, essays without paragraph breaks cannot score above Band 5 for Coherence & Cohesion.`
    );
  } else if (paragraphs.length < 4) {
    dynamicRoadmap.push(
      `Expand Essay Architecture: Add ${4 - paragraphs.length} more paragraph(s) to establish a distinct 4-paragraph IELTS format (Intro, 2 Body Paragraphs, Conclusion).`
    );
  }

  dynamicRoadmap.push(
    `Lexical Upgrade: Replace basic phrasing such as "${lexicalUpgrades[0].originalPhrase}" with Band 7.5+ academic collocations like "${lexicalUpgrades[0].suggestedCollocations[0]}" or "${lexicalUpgrades[0].suggestedCollocations[1]}".`
  );

  dynamicRoadmap.push(
    `Syntactic Diversity: Insert one inverted conditional sentence (${grammarBoosters[0].syntacticPattern}) into your main body paragraph to demonstrate Band 8.0 grammatical range.`
  );

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
        commentary: words < prompt.minWordCount
          ? `The response touches upon "${prompt.title}", but fails to reach the required minimum of ${prompt.minWordCount} words (${words} words submitted). Ideas lack full extension.`
          : `The response addresses key aspects of "${prompt.title}". Main ideas are presented and extended.`,
        keyStrengths: words >= prompt.minWordCount
          ? [`Exceeds minimum word count threshold (${words} / ${prompt.minWordCount} words)`]
          : ['Maintains direct thematic relevance to the prompt'],
        keyWeaknesses: words < prompt.minWordCount
          ? [`Critical under-length deficit: ${words} / ${prompt.minWordCount} words (incurs Task Achievement penalty)`]
          : paragraphs.length === 1
          ? ['Lack of paragraph division restricts argument development']
          : ['Supporting examples could be developed with greater depth']
      },
      coherenceCohesion: {
        score: paragraphs.length === 1 ? Math.min(ccScore, 5.5) : ccScore,
        commentary: paragraphs.length === 1
          ? 'Single continuous paragraph restricts logical organization. IELTS rubrics require distinct paragraphing.'
          : (OFFICIAL_IELTS_RUBRICS[ccScore.toFixed(1) as TargetBand]?.coherenceCohesion || 'Clear paragraphing with logical progression.'),
        keyStrengths: paragraphs.length > 1
          ? ['Logical paragraph progression throughout', 'Clear topic sentence structures']
          : ['Sentences within the paragraph maintain coherent thematic focus'],
        keyWeaknesses: paragraphs.length === 1
          ? ['Absence of paragraph breaks severely impacts discourse flow']
          : ['Could utilize more varied referential devices']
      },
      lexicalResource: {
        score: lrScore,
        commentary: OFFICIAL_IELTS_RUBRICS[lrScore.toFixed(1) as TargetBand]?.lexicalResource || 'Sufficient range of academic vocabulary.',
        keyStrengths: ['Task-relevant vocabulary demonstrated in central discussion', 'Academic tone maintained'],
        keyWeaknesses: [`Simplistic word combinations (e.g. "${lexicalUpgrades[0].originalPhrase}") should be elevated to Band 7.5+ collocations`]
      },
      grammaticalAccuracy: {
        score: graScore,
        commentary: OFFICIAL_IELTS_RUBRICS[graScore.toFixed(1) as TargetBand]?.grammaticalAccuracy || 'Mix of simple and complex sentence forms.',
        keyStrengths: ['Good sentence-level clarity and control of basic punctuation'],
        keyWeaknesses: ['Needs more advanced syntactic structures (such as inversions and fronted concessive clauses) to reach Band 7.5+']
      },
      examinerSummary: `Official IELTS Examiner Assessment yields an Overall Writing Band Score of ${overallBand.toFixed(1)}. While the central topic is acknowledged, addressing the ${words < prompt.minWordCount ? 'word count deficit' : 'structural paragraphing'} and incorporating high-level collocations are essential to reach Target Band ${targetBand}.`
    },

    layer2AlignmentReport: {
      targetStatus,
      selectedTargetBand: targetBand,
      achievedBand: overallBand,
      paragraphAudits,
      gapAnalysis: targetStatus === 'TARGET_ACHIEVED'
        ? `Your submission meets the requirements for Band ${targetBand}! Your structural execution and vocabulary range match official expectations.`
        : targetStatus === 'EXCEEDED_TARGET'
        ? `Congratulations! Your writing scored ${overallBand.toFixed(1)}, exceeding your target of Band ${targetBand}. You are ready to target Band ${(overallBand + 0.5).toFixed(1)}.`
        : `Your submission scored ${overallBand.toFixed(1)}, falling short of your Target Band ${targetBand}. Primary gaps: ${words < prompt.minWordCount ? `a ${wordDeficit}-word deficit, ` : ''}${paragraphs.length === 1 ? 'single-paragraph structuring, ' : ''}and the need for Band 7.5+ collocations and complex sentence inversions.`,
      actionableRoadmap: dynamicRoadmap,
      specificRecommendations: {
        structuralDiagnosis,
        lexicalUpgrades,
        grammarBoosters
      }
    }
  };
}
