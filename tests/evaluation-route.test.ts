import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as evaluatePost } from '@/app/api/evaluation/route';
import { signSessionToken } from '@/lib/server-auth';
import { consumeDailyEvaluationQuota, FREE_DAILY_LIMIT } from '@/lib/billing-repository';
import { getQuotaStatusForRequest } from '@/lib/quota-service';
import { validateEvaluationPayload } from '@/lib/validation';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';

function buildEvaluationRequest(body: unknown, token?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-forwarded-for': '198.51.100.42',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return new Request('http://localhost:3000/api/evaluation', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

test('POST /api/evaluation enforces auth (401), protects quota on AI unavailability (503), and returns 429 when exhausted', async () => {
  const sampleEssay =
    'Technology has transformed modern classrooms across the globe by offering interactive tools and instant access to digital libraries. However, over-reliance on screens can reduce face-to-face collaboration unless teachers balance digital tasks with structured discussion.';

  const payload = {
    essayText: sampleEssay,
    targetBand: '7.5',
    prompt: OFFICIAL_PROMPTS_DATABASE[0],
    mode: 'ACTIVE_ASSISTANT',
  };

  // 1. Unauthenticated call rejected with 401
  const unauthRes = await evaluatePost(buildEvaluationRequest(payload));
  assert.equal(unauthRes.status, 401);

  // 2. Authenticated call when GEMINI_API_KEY is absent returns 503 and consumes ZERO credits
  const mutableEnv = process.env as Record<string, string | undefined>;
  const savedGemini = mutableEnv.GEMINI_API_KEY;
  const savedMock = mutableEnv.ALLOW_MOCK_EVALUATION;
  try {
    delete mutableEnv.GEMINI_API_KEY;
    delete mutableEnv.ALLOW_MOCK_EVALUATION;

    const studentId = `eval-test-user-${Date.now()}`;
    const token = signSessionToken({
      userId: studentId,
      username: 'eval-student@example.com',
      role: 'user',
    });

    const outReq = buildEvaluationRequest(payload, token);
    const unavailableRes = await evaluatePost(outReq);
    assert.equal(unavailableRes.status, 503);

    const quotaAfterOutage = await getQuotaStatusForRequest(
      buildEvaluationRequest(payload, token),
      studentId,
      'user'
    );
    assert.equal(quotaAfterOutage.used, 0, 'Failed 503 evaluation must not deduct quota');
    assert.equal(quotaAfterOutage.remaining, FREE_DAILY_LIMIT);

    // 3. Exhaust daily quota, then confirm /api/evaluation rejects cleanly with 429
    for (let i = 0; i < FREE_DAILY_LIMIT; i += 1) {
      await consumeDailyEvaluationQuota(`user:${studentId}`, studentId, 'user');
    }

    const quotaHitRes = await evaluatePost(buildEvaluationRequest(payload, token));
    assert.equal(quotaHitRes.status, 429);
    const quotaHitBody = await quotaHitRes.json();
    assert.equal(quotaHitBody.error, 'DAILY_QUOTA_EXCEEDED');
    assert.equal(quotaHitBody.limit, FREE_DAILY_LIMIT);
    assert.equal(quotaHitBody.remaining, 0);
  } finally {
    if (savedGemini !== undefined) mutableEnv.GEMINI_API_KEY = savedGemini;
    else delete mutableEnv.GEMINI_API_KEY;
    if (savedMock !== undefined) mutableEnv.ALLOW_MOCK_EVALUATION = savedMock;
    else delete mutableEnv.ALLOW_MOCK_EVALUATION;
  }
});

test('validateEvaluationPayload rejects incomplete AI responses before persisting or charging quota', () => {
  assert.equal(validateEvaluationPayload(null).valid, false);
  assert.equal(
    validateEvaluationPayload({
      taskResponse: { score: 7.0, commentary: 'Solid', keyStrengths: [], keyWeaknesses: [] },
    }).valid,
    false
  );
  assert.equal(
    validateEvaluationPayload({
      layer1ExaminerReport: {
        taskResponse: { score: 7.0, commentary: 'Clear view', keyStrengths: ['Clear thesis'], keyWeaknesses: [] },
        coherenceCohesion: { score: 7.0, commentary: 'Cohesive', keyStrengths: [], keyWeaknesses: [] },
        lexicalResource: { score: 6.5, commentary: 'Good range', keyStrengths: [], keyWeaknesses: [] },
        grammaticalAccuracy: { score: 6.5, commentary: 'Accurate', keyStrengths: [], keyWeaknesses: [] },
        examinerSummary: 'Solid Task 2 response.',
      },
      layer2AlignmentReport: {
        targetStatus: 'TARGET_NOT_MET',
        gapAnalysis: 'Expand topic sentence 2 with empirical evidence.',
        paragraphAudits: [],
        actionableRoadmap: ['Add concrete example'],
      },
    }).valid,
    true
  );
});
