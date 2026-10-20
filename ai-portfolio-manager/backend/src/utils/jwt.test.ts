import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { signRefreshToken, verifyRefreshToken, signAccessToken, verifyAccessToken } from './jwt';
import { env } from '@/config/env';

const payload = { userId: 'same-second-test', role: 'USER' as const, tokenVersion: 0 };

test('refresh tokens and their database hashes stay unique when issued in the same second', context => {
  const now = Date.now();
  context.mock.method(Date, 'now', () => now);
  const tokens = Array.from({ length: 100 }, () => signRefreshToken(payload));
  const decoded = tokens.map(token => jwt.decode(token) as jwt.JwtPayload);
  assert.equal(new Set(decoded.map(token => token.iat)).size, 1);
  assert.equal(new Set(tokens).size, tokens.length);
  assert.equal(new Set(decoded.map(token => token.jti)).size, tokens.length);
  assert.equal(new Set(tokens.map(token => createHash('sha256').update(token).digest('hex'))).size, tokens.length);
  for (const token of tokens) {
    const verified = verifyRefreshToken(token);
    assert.equal(verified.userId, payload.userId);
    assert.equal(verified.tokenVersion, 0);
    assert.equal(verified.type, 'refresh');
    assert.ok(verified.exp! > verified.iat!);
  }
});

test('existing refresh tokens without a JWT ID remain valid until normal rotation', () => {
  const legacy = jwt.sign({ ...payload, type: 'refresh' }, env.REFRESH_TOKEN_SECRET, { expiresIn: '1h' });
  assert.equal(verifyRefreshToken(legacy).userId, payload.userId);
});

test('access and refresh tokens cannot be substituted for one another', () => {
  assert.throws(() => verifyRefreshToken(signAccessToken(payload)));
  assert.throws(() => verifyAccessToken(signRefreshToken(payload)));
  const wrongSignature = jwt.sign({ ...payload, type: 'refresh' }, 'a-different-secret', { expiresIn: '1h' });
  assert.throws(() => verifyRefreshToken(wrongSignature));
  const expired = jwt.sign({ ...payload, type: 'refresh' }, env.REFRESH_TOKEN_SECRET, { expiresIn: -1 });
  assert.throws(() => verifyRefreshToken(expired), /expired/);
});
