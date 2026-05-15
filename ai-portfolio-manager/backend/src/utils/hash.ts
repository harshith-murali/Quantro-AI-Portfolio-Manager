import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '@/config/env';

/**
 * Hash a plaintext password with bcrypt.
 * Cost factor is read from env (default 12).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Constant-time comparison of a plaintext password against its bcrypt hash.
 */
export async function comparePassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Deterministic SHA-256 hash of a string (used for refresh token storage).
 * bcrypt is intentionally non-deterministic; SHA-256 allows DB lookups.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
