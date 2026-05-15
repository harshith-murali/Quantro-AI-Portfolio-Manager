import prisma from '@/config/db';
import { hashToken, hashPassword } from '@/utils/hash';
import { getRefreshTokenExpiry } from '@/utils/jwt';
import { AuthError } from '@/utils/AppError';

/**
 * Creates and persists a new refresh token record.
 * Stores a SHA-256 hash of the raw JWT — the raw token only lives in the cookie.
 */
export async function createRefreshToken(
  userId: string,
  rawToken: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const expiresAt = getRefreshTokenExpiry();

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });
}

/**
 * Looks up a refresh token by its SHA-256 hash.
 * Returns null if not found.
 */
export async function findRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  return prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });
}

/**
 * Marks a single refresh token as revoked.
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken
    .update({
      where: { token: tokenHash },
      data: { revoked: true },
    })
    .catch(() => {
      // Silently ignore if token doesn't exist (already revoked / expired)
    });
}

/**
 * Revokes ALL active refresh tokens for a given user.
 * Called on logout to invalidate all sessions across devices.
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

/**
 * Deletes refresh tokens that are expired or revoked, for a given user.
 * Should be called periodically or on login to keep the table clean.
 */
export async function cleanupUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      OR: [
        { revoked: true },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });
}

/**
 * Validates a refresh token record:
 * - Exists in DB
 * - Not revoked
 * - Not expired
 * - tokenVersion matches the user's current version
 *
 * Throws AuthError on any validation failure.
 */
export async function validateRefreshTokenRecord(
  rawToken: string,
  expectedTokenVersion: number,
): Promise<{ userId: string }> {
  const record = await findRefreshToken(rawToken);

  if (!record) {
    throw new AuthError('Refresh token not found');
  }

  if (record.revoked) {
    // Token reuse detected — revoke all user tokens as a security measure
    await revokeAllUserTokens(record.userId);
    throw new AuthError('Refresh token has been revoked. All sessions terminated.');
  }

  if (record.expiresAt < new Date()) {
    throw new AuthError('Refresh token has expired');
  }

  if (record.user.tokenVersion !== expectedTokenVersion) {
    throw new AuthError('Session invalidated. Please log in again.');
  }

  return { userId: record.userId };
}
