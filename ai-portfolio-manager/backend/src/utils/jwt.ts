import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { JwtPayload, TokenPair } from '@/types/auth.types';
import { AuthError } from '@/utils/AppError';
import { Role } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────

type TokenPayloadInput = {
  userId: string;
  role: Role;
  tokenVersion: number;
};

// ─── Sign ─────────────────────────────────────────────────────────

export function signAccessToken(payload: TokenPayloadInput): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY } as SignOptions,
  );
}

export function signRefreshToken(payload: TokenPayloadInput): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY } as SignOptions,
  );
}

// ─── Verify ───────────────────────────────────────────────────────

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    if (payload.type !== 'access') {
      throw new AuthError('Invalid token type');
    }
    return payload;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError('Access token has expired');
    }
    throw new AuthError('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
    if (payload.type !== 'refresh') {
      throw new AuthError('Invalid token type');
    }
    return payload;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError('Refresh token has expired');
    }
    throw new AuthError('Invalid refresh token');
  }
}

// ─── Token pair ───────────────────────────────────────────────────

export function generateTokenPair(
  userId: string,
  role: Role,
  tokenVersion: number,
): TokenPair {
  const payload: TokenPayloadInput = { userId, role, tokenVersion };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

// ─── Expiry ───────────────────────────────────────────────────────

/** Returns the absolute expiry Date for the refresh token (7d default). */
export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  // Parse "7d" → 7 days in ms
  const raw = env.REFRESH_TOKEN_EXPIRY; // e.g. "7d"
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) {
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  expiry.setTime(expiry.getTime() + value * (ms[unit] ?? ms['d']));
  return expiry;
}
