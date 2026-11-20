import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSigningSecret,
  signSessionToken,
  verifySessionToken,
} from '@/lib/server-auth';
import { sanitizePdfText } from '@/lib/pdf-service';

test('HMAC session signing validates payload, rejects tampering, and rejects expiration', () => {
  const token = signSessionToken({
    userId: 'user-123',
    username: 'student@example.com',
    role: 'user',
  });

  const verified = verifySessionToken(token, ['user']);
  assert.ok(verified);
  assert.equal(verified.userId, 'user-123');
  assert.equal(verified.role, 'user');

  // Role check enforcement
  assert.equal(verifySessionToken(token, ['admin']), null);

  // Tampered payload fails signature check
  const [payloadPart, sigPart] = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ userId: 'user-123', username: 'admin', role: 'admin', exp: Date.now() + 60000 })
  ).toString('base64url');
  assert.equal(verifySessionToken(`${tamperedPayload}.${sigPart}`), null);

  // Altered signature character fails
  const badSig = `${sigPart.slice(0, -1)}${sigPart.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(verifySessionToken(`${payloadPart}.${badSig}`), null);

  // Expired token rejected
  const expiredToken = signSessionToken(
    { userId: 'user-123', username: 'student@example.com', role: 'user' },
    -1000
  );
  assert.equal(verifySessionToken(expiredToken), null);
});

test('getSigningSecret and signSessionToken fail closed in production without configured secret', () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const savedEnv = {
    NODE_ENV: mutableEnv.NODE_ENV,
    ADMIN_SECRET: mutableEnv.ADMIN_SECRET,
    ADMIN_SESSION_SECRET: mutableEnv.ADMIN_SESSION_SECRET,
    ADMIN_PASSWORD: mutableEnv.ADMIN_PASSWORD,
  };

  try {
    mutableEnv.NODE_ENV = 'production';
    delete mutableEnv.ADMIN_SECRET;
    delete mutableEnv.ADMIN_SESSION_SECRET;
    delete mutableEnv.ADMIN_PASSWORD;

    assert.equal(getSigningSecret(), null);
    assert.throws(
      () =>
        signSessionToken({
          userId: 'u1',
          username: 'a',
          role: 'user',
        }),
      /not configured in production/i
    );
    assert.equal(verifySessionToken('anything.invalid'), null);
  } finally {
    mutableEnv.NODE_ENV = savedEnv.NODE_ENV;
    if (savedEnv.ADMIN_SECRET !== undefined) mutableEnv.ADMIN_SECRET = savedEnv.ADMIN_SECRET;
    else delete mutableEnv.ADMIN_SECRET;
    if (savedEnv.ADMIN_SESSION_SECRET !== undefined) {
      mutableEnv.ADMIN_SESSION_SECRET = savedEnv.ADMIN_SESSION_SECRET;
    }
    if (savedEnv.ADMIN_PASSWORD !== undefined) mutableEnv.ADMIN_PASSWORD = savedEnv.ADMIN_PASSWORD;
  }
});

test('sanitizePdfText transliterates Cyrillic and Uzbek typography cleanly for WinAnsi PDF fonts', () => {
  assert.equal(sanitizePdfText('Шухрат — Ўзбекистон'), "Shuxrat".replace('x', 'kh') + " - O'zbekiston");
  assert.equal(sanitizePdfText('“Smart quotes” • Item → Band 8.0'), '"Smart quotes" * Item -> Band 8.0');
});

