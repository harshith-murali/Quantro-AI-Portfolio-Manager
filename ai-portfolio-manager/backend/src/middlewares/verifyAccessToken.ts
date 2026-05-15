import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthError } from '@/utils/AppError';
import { authLogger } from '@/utils/logger';
import prisma from '@/config/db';

/**
 * Validates the Bearer access token from the Authorization header.
 * On success, attaches the full user record to req.user.
 * On failure, calls next(AuthError).
 */
export async function verifyAccessTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Authorization header missing or malformed');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Fetch fresh user from DB to get current role/status
    // (also guards against deleted accounts)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError('User account not found');
    }

    // Validate tokenVersion to support instant session invalidation
    if (user.tokenVersion !== payload.tokenVersion) {
      authLogger.tokenInvalid('tokenVersion mismatch — user logged out', req.ip ?? '');
      throw new AuthError('Session has been invalidated. Please log in again.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
