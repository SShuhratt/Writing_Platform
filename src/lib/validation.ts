import { NextResponse } from 'next/server';

export function logStructuredError(
  context: string,
  err: unknown,
  meta?: Record<string, unknown>
): void {
  const message = err instanceof Error ? err.message : String(err);
  const entry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    context,
    message,
    ...(meta || {}),
  };
  console.error(JSON.stringify(entry));
}

function isValidCriterionBlock(block: unknown): boolean {
  if (!block || typeof block !== 'object') return false;
  const b = block as Record<string, unknown>;
  return (
    typeof b.score === 'number' &&
    !Number.isNaN(b.score) &&
    b.score >= 1 &&
    b.score <= 9 &&
    typeof b.commentary === 'string' &&
    Array.isArray(b.keyStrengths) &&
    Array.isArray(b.keyWeaknesses)
  );
}

/**
 * Validates that a parsed Gemini Dual-Layer Evaluation JSON payload satisfies
 * the required examiner and alignment structures before quota consumption or persistence.
 */
export function validateEvaluationPayload(raw: unknown): {
  valid: boolean;
  reason?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, reason: 'Payload is not a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const layer1 = obj.layer1ExaminerReport as Record<string, unknown> | undefined;
  const layer2 = obj.layer2AlignmentReport as Record<string, unknown> | undefined;

  if (!layer1 || typeof layer1 !== 'object') {
    return { valid: false, reason: 'Missing layer1ExaminerReport.' };
  }
  if (
    !isValidCriterionBlock(layer1.taskResponse) ||
    !isValidCriterionBlock(layer1.coherenceCohesion) ||
    !isValidCriterionBlock(layer1.lexicalResource) ||
    !isValidCriterionBlock(layer1.grammaticalAccuracy)
  ) {
    return { valid: false, reason: 'Invalid or incomplete Layer 1 criterion blocks.' };
  }
  if (typeof layer1.examinerSummary !== 'string' || !layer1.examinerSummary.trim()) {
    return { valid: false, reason: 'Missing examinerSummary.' };
  }

  if (!layer2 || typeof layer2 !== 'object') {
    return { valid: false, reason: 'Missing layer2AlignmentReport.' };
  }
  if (
    !['TARGET_ACHIEVED', 'TARGET_NOT_MET', 'EXCEEDED_TARGET'].includes(
      String(layer2.targetStatus || '')
    )
  ) {
    return { valid: false, reason: 'Invalid targetStatus.' };
  }
  if (!Array.isArray(layer2.paragraphAudits) || !Array.isArray(layer2.actionableRoadmap)) {
    return { valid: false, reason: 'Missing paragraphAudits or actionableRoadmap arrays.' };
  }
  if (typeof layer2.gapAnalysis !== 'string') {
    return { valid: false, reason: 'Missing gapAnalysis.' };
  }

  return { valid: true };
}

/**
 * Validates parsed Gemini Socratic guidance JSON before returning to the workspace.
 */
export function validateGuidancePayload(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.cards)) return false;

  for (const card of obj.cards) {
    if (!card || typeof card !== 'object') return false;
    const c = card as Record<string, unknown>;
    if (typeof c.title !== 'string' || typeof c.socraticPrompt !== 'string') {
      return false;
    }
  }
  return true;
}

export function unauthorizedResponse(message = 'Authentication required.'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

