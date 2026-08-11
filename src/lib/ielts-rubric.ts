import { TargetBand } from '@/types/ielts';

export interface CriterionRubric {
  taskResponse: string;
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalAccuracy: string;
}

export const OFFICIAL_IELTS_RUBRICS: Record<TargetBand, CriterionRubric> = {
  '5.0': {
    taskResponse: 'Addresses the task only partially; format may be inappropriate in places. Expresses a position but development is unclear. Main ideas presented but limited/repetitive.',
    coherenceCohesion: 'Presents information with some organization but lacks overall progression. Inaccurate or overuse of cohesive devices. May lack paragraphing or show inadequate paragraphing.',
    lexicalResource: 'Uses limited vocabulary which is minimally adequate for the task. Makes noticeable errors in spelling and/or word formation that may cause difficulty for the reader.',
    grammaticalAccuracy: 'Uses only a limited range of structures. Attempts complex sentences but these tend to be less accurate than simple sentences. Frequent grammatical errors.'
  },
  '5.5': {
    taskResponse: 'Addresses main requirements but development lacks consistency. Supports key points with inadequate or irrelevant ideas in some sections.',
    coherenceCohesion: 'Organizes main ideas with basic progression. Cohesive devices used mechanically with occasional inaccuracies.',
    lexicalResource: 'Sufficient range of vocabulary for task requirements, though inappropriate word choice and collocations are evident.',
    grammaticalAccuracy: 'Mix of simple and complex sentence forms. Frequent minor errors in grammar and punctuation that do not impede communication.'
  },
  '6.0': {
    taskResponse: 'Addresses all parts of the task. Presents a relevant position though conclusions may be unclear or repetitive. Presents relevant main ideas but some may be inadequately developed.',
    coherenceCohesion: 'Arranges information logically with clear overall progression. Uses cohesive devices effectively, though cohesion within sentences may be faulty. Paragraphing is clear.',
    lexicalResource: 'Uses an adequate range of vocabulary for the task. Attempts to use less common vocabulary with some inaccuracy. Makes some errors in spelling and word formation.',
    grammaticalAccuracy: 'Uses a mix of simple and complex sentence forms. Makes some errors in grammar and punctuation, though these rarely reduce communication effectiveness.'
  },
  '6.5': {
    taskResponse: 'Covers all main parts of the task effectively. Relevant position presented and supported throughout, with slight gaps in explanation.',
    coherenceCohesion: 'Clear progression throughout the response. Varied cohesive devices with minor over/underuse. Clear paragraph structure.',
    lexicalResource: 'Sufficient range of vocabulary with flexibility and precision. Uses less common items with minor errors in collocation.',
    grammaticalAccuracy: 'Uses a variety of complex structures with good control. Frequent error-free sentences with minor slips.'
  },
  '7.0': {
    taskResponse: 'Covers all parts of the task thoroughly. Presents a clear position throughout. Presents, extends, and supports main ideas with well-reasoned explanations.',
    coherenceCohesion: 'Logically organizes information with clear progression. Uses a range of cohesive devices appropriately. Clear topic sentences in every paragraph.',
    lexicalResource: 'Uses a sufficient range of vocabulary to allow flexibility and precision. Uses less common lexical items with awareness of style and collocation.',
    grammaticalAccuracy: 'Uses a variety of complex structures. Produces frequent error-free sentences. Good control of grammar and punctuation with occasional errors.'
  },
  '7.5': {
    taskResponse: 'Fully addresses all requirements with well-developed responses. Sustained logical argument backed by relevant examples.',
    coherenceCohesion: 'Skillfully manages paragraphing and logical sequencing. Cohesive devices feel natural and seamless.',
    lexicalResource: 'Wide range of vocabulary used flexibly. Good control of sophistication, collocations, and idiomatic expressions with rare errors.',
    grammaticalAccuracy: 'Wide range of complex structures used with high accuracy. Majority of sentences are completely error-free.'
  },
  '8.0': {
    taskResponse: 'Sufficiently answers all aspects of the prompt with a well-developed, clear response. Relevant, extended, and supported ideas.',
    coherenceCohesion: 'Sequences information and ideas logically. Manages paragraphing skillfully. Cohesion between paragraphs is natural.',
    lexicalResource: 'Uses a wide range of vocabulary fluently and flexibly to convey precise meanings. Skillfully uses less common and idiomatic items with rare inaccuracies.',
    grammaticalAccuracy: 'Uses a wide range of structures with full flexibility and accuracy. Occasional minor slips or non-systematic errors.'
  },
  '8.5': {
    taskResponse: 'Completely satisfies all task requirements. Sophisticated development of main arguments with seamless integration of examples.',
    coherenceCohesion: 'Flawless progression and cohesive flow. Natural, unobtrusive linking throughout.',
    lexicalResource: 'Full flexibility and precise use of vocabulary. Advanced idioms and collocations used effortlessly.',
    grammaticalAccuracy: 'Full range of grammatical structures used with effortless control and precision.'
  },
  '9.0': {
    taskResponse: 'Fully satisfies all requirements of the task. Clear, fully developed, and persuasive response with precise explanations and natural supporting details.',
    coherenceCohesion: 'Uses cohesion in such a way that it attracts no attention. Skillfully manages paragraphing throughout.',
    lexicalResource: 'Uses a wide range of vocabulary with full flexibility and control in a effortless and natural manner.',
    grammaticalAccuracy: 'Uses a full range of structures with full flexibility and accuracy; rare minor errors occur only as slips.'
  }
};

export const ALL_TARGET_BANDS: TargetBand[] = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

/**
 * Calculates official overall IELTS band score rounded to nearest 0.5 according to official IELTS rules:
 * - If average ends in .125 -> rounds down to .00
 * - If average ends in .25 -> rounds up to .50
 * - If average ends in .375 -> rounds up to .50
 * - If average ends in .625 -> rounds down to .50
 * - If average ends in .75 -> rounds up to next full band (.00)
 */
export function calculateOverallBandScore(ta: number, cc: number, lr: number, gra: number): number {
  const avg = (ta + cc + lr + gra) / 4;
  const decimal = avg % 1;

  if (decimal < 0.25) return Math.floor(avg);
  if (decimal < 0.75) return Math.floor(avg) + 0.5;
  return Math.ceil(avg);
}
