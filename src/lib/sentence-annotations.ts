import {
  LexicalUpgradeItem,
  SentenceAnnotation,
  SentenceAnnotationCriterion,
  SentenceAnnotationType,
} from '@/types/ielts';

export interface AnnotatedTextSegment {
  text: string;
  annotation?: SentenceAnnotation;
  occurrenceIndex?: number;
}

export interface AnnotatedParagraph {
  paragraphIndex: number;
  segments: AnnotatedTextSegment[];
}

interface ResolvedSpan {
  start: number;
  end: number;
  annotation: SentenceAnnotation;
}

const VALID_ANNOTATION_TYPES = new Set<SentenceAnnotationType>([
  'ERROR',
  'COLLOCATION',
  'COHERENCE',
  'STRENGTH',
]);

const VALID_CRITERIA = new Set<SentenceAnnotationCriterion>(['TR', 'CC', 'LR', 'GRA']);

const MAX_ANNOTATIONS = 10;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeAnnotationString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen).trim();
}

/**
 * Builds a whitespace-tolerant regex to locate an annotation quote in a candidate paragraph.
 */
function buildQuoteRegex(quote: string): RegExp | null {
  const normalized = quote.trim().replace(/\s+/g, ' ');
  if (normalized.length < 3 || normalized.length > 360) return null;

  const tokens = normalized.split(' ').map(escapeRegex);
  const patternBody = tokens.join('\\s+');
  const needsLeadingBoundary = /^[a-zA-Z0-9]/.test(normalized);
  const needsTrailingBoundary = /[a-zA-Z0-9]$/.test(normalized);
  const shortPhrase = normalized.length <= 24;

  const prefix = shortPhrase && needsLeadingBoundary ? '\\b' : '';
  const suffix = shortPhrase && needsTrailingBoundary ? '\\b' : '';

  try {
    return new RegExp(`${prefix}${patternBody}${suffix}`, 'i');
  } catch {
    return null;
  }
}

function overlapsExisting(spans: Array<{ start: number; end: number }>, start: number, end: number): boolean {
  return spans.some((span) => start < span.end && end > span.start);
}

/**
 * Finds the first non-overlapping, intra-paragraph match for a quote in text and claims its range.
 */
function claimQuoteInText(
  text: string,
  quote: string,
  claimedRanges: Array<{ start: number; end: number }>
): string | null {
  const regex = buildQuoteRegex(quote);
  if (!regex) return null;

  const globalRegex = new RegExp(regex.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = globalRegex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (
      !/\r?\n\s*\r?\n/.test(match[0]) &&
      !overlapsExisting(claimedRanges, start, end)
    ) {
      claimedRanges.push({ start, end });
      return match[0];
    }
    if (match[0].length === 0) break;
  }

  return null;
}

interface CollocationRule {
  pattern: RegExp;
  label: string;
  explanation: string;
  suggestion: string;
}

const COLLOCATION_RULES: CollocationRule[] = [
  {
    pattern: /\b(?:a lot of|lots of)\b/i,
    label: 'Informal Quantifier',
    explanation: 'Informal spoken quantifiers limit Lexical Resource around Band 6.0.',
    suggestion: 'a substantial proportion of / a considerable number of',
  },
  {
    pattern: /\bvery (?:good|great|nice)\b/i,
    label: 'Weak Qualifier + Adjective',
    explanation: 'Pairing "very" with basic adjectives weakens academic precision.',
    suggestion: 'profoundly advantageous / remarkably beneficial',
  },
  {
    pattern: /\bvery (?:bad|harmful|dangerous)\b/i,
    label: 'Weak Negative Qualifier',
    explanation: 'Replace basic intensifier + adjective pairs with high-band academic lexis.',
    suggestion: 'severely detrimental / acutely damaging',
  },
  {
    pattern: /\bvery important\b/i,
    label: 'Basic Evaluative Phrase',
    explanation: '"Very important" is overused at Band 5.5–6.0; opt for formal emphasis.',
    suggestion: 'of paramount importance / indispensable',
  },
  {
    pattern: /\bbig problems?\b/i,
    label: 'Simplistic Noun Collocation',
    explanation: 'Use domain-appropriate collocations instead of "big problem".',
    suggestion: 'acute societal dilemma / pressing systemic challenge',
  },
  {
    pattern: /\bnowadays\b/i,
    label: 'Conversational Time Marker',
    explanation: '"Nowadays" sounds conversational; formal time framing strengthens register.',
    suggestion: 'in the contemporary era / in modern society',
  },
  {
    pattern: /\bmore and more\b/i,
    label: 'Repetitive Comparative',
    explanation: 'Avoid informal repetition in formal Task 1 and Task 2 responses.',
    suggestion: 'an escalating proportion of / increasingly prevalent',
  },
  {
    pattern: /\bget (?:better|worse)\b/i,
    label: 'Informal Phrasal Verb',
    explanation: 'Replace conversational "get + adjective" with precise academic verbs.',
    suggestion: 'ameliorate / deteriorate substantially',
  },
  {
    pattern: /\bkids\b/i,
    label: 'Colloquial Noun',
    explanation: '"Kids" is too informal for academic IELTS writing.',
    suggestion: 'young learners / juveniles / children',
  },
  {
    pattern: /\bthings\b/i,
    label: 'Vague Noun Choice',
    explanation: 'Replace vague placeholder nouns with concrete academic concepts.',
    suggestion: 'factors / phenomena / dimensions',
  },
];

interface GrammarRule {
  pattern: RegExp;
  groupIndex?: number;
  label: string;
  explanation: string;
  suggestion: (match: RegExpExecArray) => string;
}

const GRAMMAR_RULES: GrammarRule[] = [
  {
    pattern: /\bin my opinion,?\s*i think\b/i,
    label: 'Redundant Stance Framing',
    explanation: 'Using both "in my opinion" and "I think" duplicates the stance marker.',
    suggestion: () => 'In my view, ... (use only one clear stance marker)',
  },
  {
    pattern: /(?:^|[\s(])(i)(?=[\s'’.,!?;:])/,
    groupIndex: 1,
    label: 'Capitalization Mechanics',
    explanation: 'The first-person singular pronoun "I" must always be capitalized.',
    suggestion: () => 'I',
  },
  {
    pattern: /\b(the|and|to|of|in|is|are|was|were|that|for|with|a|an)\s+\1\b/i,
    label: 'Duplicated Word',
    explanation: 'Accidental word repetition lowers Grammatical Range & Accuracy control.',
    suggestion: (m) => m[1],
  },
  {
    pattern: /\b(can|could|should|will|would|may|might|must)\s+to\s+([a-z]{2,})\b/i,
    label: 'Modal Verb + Bare Infinitive',
    explanation: 'English modal verbs take a bare infinitive without "to".',
    suggestion: (m) => `${m[1]} ${m[2]}`,
  },
  {
    pattern: /\b(people|students|children|governments|individuals|experts)\s+(is|was|has)\b/i,
    label: 'Subject–Verb Agreement',
    explanation: 'Plural noun subjects require plural auxiliary verbs (are / were / have).',
    suggestion: (m) => {
      const verb = m[2].toLowerCase();
      const fixed = verb === 'is' ? 'are' : verb === 'was' ? 'were' : 'have';
      return `${m[1]} ${fixed}`;
    },
  },
  {
    pattern: /\b(everyone|everybody|someone|somebody|nobody|this trend|this issue)\s+(are|were|have)\b/i,
    label: 'Subject–Verb Agreement',
    explanation: 'Singular subjects and indefinite pronouns take singular verbs (is / was / has).',
    suggestion: (m) => {
      const verb = m[2].toLowerCase();
      const fixed = verb === 'are' ? 'is' : verb === 'were' ? 'was' : 'has';
      return `${m[1]} ${fixed}`;
    },
  },
  {
    pattern: /\bthere\s+(is|was)\s+(many|several|numerous|two|three|four|five|a lot of)\b/i,
    label: 'Existential Clause Agreement',
    explanation: 'Plural noun phrases after "there" require a plural verb.',
    suggestion: (m) => `there ${m[1].toLowerCase() === 'was' ? 'were' : 'are'} ${m[2]}`,
  },
  {
    pattern: /\ba\s+(hour|apple|example|issue|important|advantage|effect|impact|increase|economy|opinion|essay|argument)\b/i,
    label: 'Article Selection (a / an)',
    explanation: 'Use the indefinite article "an" before words beginning with a vowel sound.',
    suggestion: (m) => `an ${m[1]}`,
  },
];

const STRENGTH_PATTERNS: Array<{ pattern: RegExp; label: string; explanation: string }> = [
  {
    pattern: /\b(?:nevertheless|nonetheless|conversely|notwithstanding)\b/i,
    label: 'Band 8.0 Cohesive Contrast',
    explanation: 'Sophisticated concessive/contrastive transition strengthens Coherence & Cohesion.',
  },
  {
    pattern: /\b(?:mitigate|exacerbate|proliferation|paramount|indispensable|unprecedented|ubiquitous|predominantly)\b/i,
    label: 'High-Band Academic Lexis',
    explanation: 'Precise C1/C2 vocabulary demonstrates strong Lexical Resource control.',
  },
  {
    pattern: /\bwere\s+[a-z\s]{2,30}\s+to\s+[a-z]+\b/i,
    label: 'Inverted Conditional (Band 8+)',
    explanation: 'Subject–auxiliary inversion showcases advanced grammatical range.',
  },
  {
    pattern: /\bnot only\b[^.!?\n]{3,80}\bbut also\b/i,
    label: 'Correlative Clause Variety',
    explanation: 'Correlative parallel structure boosts Grammatical Range & Accuracy.',
  },
];

/**
 * Generates deterministic, verbatim-grounded sentence and phrase annotations from candidate essay text.
 */
export function generateFallbackSentenceAnnotations(
  essayText: string,
  lexicalUpgrades?: LexicalUpgradeItem[]
): SentenceAnnotation[] {
  if (!essayText || !essayText.trim()) return [];

  const results: SentenceAnnotation[] = [];
  const claimedQuotes = new Set<string>();
  const claimedRanges: Array<{ start: number; end: number }> = [];

  const pushIfUnique = (annotation: Omit<SentenceAnnotation, 'id'>) => {
    if (results.length >= MAX_ANNOTATIONS) return;
    const key = annotation.exactQuote.toLowerCase().trim();
    if (!key || claimedQuotes.has(key)) return;
    const matched = claimQuoteInText(essayText, annotation.exactQuote, claimedRanges);
    if (!matched) return;
    claimedQuotes.add(key);
    results.push({
      id: `ann-${results.length + 1}`,
      ...annotation,
      exactQuote: matched,
    });
  };

  // 1. Grammar and mechanics patterns (highest examiner priority)
  for (const rule of GRAMMAR_RULES) {
    const match = rule.pattern.exec(essayText);
    if (!match) continue;
    const exactQuote =
      rule.groupIndex !== undefined && match[rule.groupIndex]
        ? match[rule.groupIndex]
        : match[0];
    pushIfUnique({
      exactQuote,
      type: 'ERROR',
      criterion: 'GRA',
      issueLabel: rule.label,
      explanation: rule.explanation,
      suggestion: rule.suggestion(match),
    });
  }

  // 2. Lexical collocations already mined in Layer 2 recommendations (when verbatim in text)
  if (Array.isArray(lexicalUpgrades)) {
    for (const upgrade of lexicalUpgrades) {
      const cleanedQuote = upgrade.originalPhrase.replace(/^"+|"+$/g, '').replace(/\.\.\.$/, '').trim();
      if (
        cleanedQuote.length >= 3 &&
        cleanedQuote.length <= 60 &&
        !cleanedQuote.toLowerCase().includes('qualitative claims')
      ) {
        pushIfUnique({
          exactQuote: cleanedQuote,
          type: 'COLLOCATION',
          criterion: 'LR',
          issueLabel: 'Band 7.5+ Collocation Upgrade',
          explanation: upgrade.pedagogicalContext,
          suggestion: upgrade.suggestedCollocations.slice(0, 3).join(' / '),
        });
      }
    }
  }

  // 3. Deterministic collocation upgrades
  for (const rule of COLLOCATION_RULES) {
    const match = rule.pattern.exec(essayText);
    if (!match) continue;
    pushIfUnique({
      exactQuote: match[0],
      type: 'COLLOCATION',
      criterion: 'LR',
      issueLabel: rule.label,
      explanation: rule.explanation,
      suggestion: rule.suggestion,
    });
  }

  // 4. Sentence-level coherence & run-on / under-extension checks
  const rawSentences = essayText
    .split(/(?<=[.!?])\s+|\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const conjunctionOpenerMatch = /(?:^|[.!?]\s+)((?:And|But|So),?(?:\s+[a-zA-Z]+){0,1})/.exec(
    essayText
  );
  if (conjunctionOpenerMatch?.[1]) {
    pushIfUnique({
      exactQuote: conjunctionOpenerMatch[1],
      type: 'COHERENCE',
      criterion: 'CC',
      issueLabel: 'Informal Sentence Opener',
      explanation: 'Starting sentences with "And", "But", or "So" reduces academic register.',
      suggestion: 'Open with "Furthermore,", "However,", or "Consequently,".',
    });
  }

  for (const sentence of rawSentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 44 && !sentence.includes(';') && sentence.length <= 320) {
      pushIfUnique({
        exactQuote: sentence,
        type: 'ERROR',
        criterion: 'GRA',
        issueLabel: 'Run-On / Overextended Sentence',
        explanation: `This ${wordCount}-word sentence risks losing grammatical control. Splitting or restructuring increases clarity.`,
        suggestion: 'Split into two balanced complex sentences linked by a cohesive adverbial.',
      });
      break;
    }
  }

  if (rawSentences.length >= 3) {
    for (const sentence of rawSentences) {
      const wordCount = sentence.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 3 && wordCount <= 6 && /[.!?]$/.test(sentence)) {
        pushIfUnique({
          exactQuote: sentence,
          type: 'COHERENCE',
          criterion: 'TR',
          issueLabel: 'Underdeveloped Idea',
          explanation: 'Very brief statements often lack the PEEL explanation or evidence expected at Band 7.0+.',
          suggestion: 'Extend this sentence with a "because..." clause or concrete real-world example.',
        });
        break;
      }
    }
  }

  // 5. Recognize existing high-band strengths so feedback stays balanced
  let strengthCount = 0;
  for (const strength of STRENGTH_PATTERNS) {
    if (strengthCount >= 2) break;
    const match = strength.pattern.exec(essayText);
    if (!match) continue;
    const beforeLen = results.length;
    pushIfUnique({
      exactQuote: match[0].trim(),
      type: 'STRENGTH',
      criterion: strength.label.includes('Cohesive') ? 'CC' : strength.label.includes('Lexis') ? 'LR' : 'GRA',
      issueLabel: strength.label,
      explanation: strength.explanation,
    });
    if (results.length > beforeLen) strengthCount++;
  }

  return results;
}

/**
 * Validates AI-returned sentence annotations against the actual essay text and supplements gaps deterministically.
 */
export function normalizeSentenceAnnotations(
  essayText: string,
  rawAnnotations: unknown,
  lexicalUpgrades?: LexicalUpgradeItem[]
): SentenceAnnotation[] {
  const validItems: SentenceAnnotation[] = [];
  const seenQuotes = new Set<string>();
  const claimedRanges: Array<{ start: number; end: number }> = [];

  if (Array.isArray(rawAnnotations)) {
    for (let i = 0; i < rawAnnotations.length && validItems.length < MAX_ANNOTATIONS; i++) {
      const item = rawAnnotations[i];
      if (!item || typeof item !== 'object') continue;
      const candidate = item as Record<string, unknown>;

      const exactQuote = sanitizeAnnotationString(candidate.exactQuote, 320);
      const issueLabel = sanitizeAnnotationString(candidate.issueLabel, 80);
      const explanation = sanitizeAnnotationString(candidate.explanation, 280);
      const suggestion = sanitizeAnnotationString(candidate.suggestion, 240);
      const rawType = String(candidate.type || '').toUpperCase() as SentenceAnnotationType;
      const rawCriterion = String(candidate.criterion || '').toUpperCase() as SentenceAnnotationCriterion;

      if (
        !exactQuote ||
        !issueLabel ||
        !explanation ||
        !VALID_ANNOTATION_TYPES.has(rawType) ||
        !VALID_CRITERIA.has(rawCriterion)
      ) {
        continue;
      }

      const key = exactQuote.toLowerCase();
      if (seenQuotes.has(key)) continue;

      const matched = claimQuoteInText(essayText, exactQuote, claimedRanges);
      if (!matched) continue;

      seenQuotes.add(key);
      validItems.push({
        id: sanitizeAnnotationString(candidate.id, 40) || `ann-${validItems.length + 1}`,
        exactQuote: matched,
        type: rawType,
        criterion: rawCriterion,
        issueLabel,
        explanation,
        ...(suggestion ? { suggestion } : {}),
      });
    }
  }

  // Supplement with deterministic fallback checks if AI returned fewer than 2 matched annotations
  if (validItems.length < 2) {
    const fallback = generateFallbackSentenceAnnotations(essayText, lexicalUpgrades);
    for (const fb of fallback) {
      if (validItems.length >= MAX_ANNOTATIONS) break;
      const key = fb.exactQuote.toLowerCase();
      if (seenQuotes.has(key)) continue;
      const matched = claimQuoteInText(essayText, fb.exactQuote, claimedRanges);
      if (!matched) continue;
      seenQuotes.add(key);
      validItems.push({
        ...fb,
        exactQuote: matched,
        id: `ann-${validItems.length + 1}`,
      });
    }
  }

  return validItems;
}

/**
 * Splits an essay into paragraphs and non-overlapping highlighted inline segments for rendering.
 */
export function buildAnnotatedParagraphs(
  essayText: string,
  annotations: SentenceAnnotation[]
): { paragraphs: AnnotatedParagraph[]; matchedAnnotations: SentenceAnnotation[] } {
  const rawParagraphs = essayText.split(/\r?\n\s*\r?\n/);
  const annotatedParagraphs: AnnotatedParagraph[] = [];
  const usedIds = new Set<string>();
  const matchedAnnotations: SentenceAnnotation[] = [];

  for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
    const pText = rawParagraphs[pIdx];
    const spans: ResolvedSpan[] = [];

    for (const annotation of annotations) {
      if (usedIds.has(annotation.id)) continue;
      const regex = buildQuoteRegex(annotation.exactQuote);
      if (!regex) continue;

      // Scan within this paragraph for an unclaimed non-overlapping occurrence
      const globalRegex = new RegExp(regex.source, 'gi');
      let match: RegExpExecArray | null;
      while ((match = globalRegex.exec(pText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (!overlapsExisting(spans, start, end)) {
          spans.push({ start, end, annotation });
          usedIds.add(annotation.id);
          break;
        }
        if (match[0].length === 0) break;
      }
    }

    spans.sort((a, b) => a.start - b.start);

    const segments: AnnotatedTextSegment[] = [];
    let cursor = 0;

    for (const span of spans) {
      if (span.start > cursor) {
        segments.push({ text: pText.slice(cursor, span.start) });
      }
      const occurrenceIndex = matchedAnnotations.length;
      matchedAnnotations.push(span.annotation);
      segments.push({
        text: pText.slice(span.start, span.end),
        annotation: span.annotation,
        occurrenceIndex,
      });
      cursor = span.end;
    }

    if (cursor < pText.length) {
      segments.push({ text: pText.slice(cursor) });
    }

    if (segments.length === 0 && pText.length > 0) {
      segments.push({ text: pText });
    }

    annotatedParagraphs.push({
      paragraphIndex: pIdx,
      segments,
    });
  }

  return {
    paragraphs: annotatedParagraphs,
    matchedAnnotations,
  };
}
