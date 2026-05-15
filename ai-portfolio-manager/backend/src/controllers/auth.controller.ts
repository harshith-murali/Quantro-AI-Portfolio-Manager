import { Request, Response } from 'express';
import * as AuthService from '@/services/auth.service';
import { successResponse } from '@/utils/ApiResponse';
import { AuthError } from '@/utils/AppError';
import { env } from '@/config/env';

// ─── Cookie config ────────────────────────────────────────────────

const REFRESH_COOKIE_NAME = 'rt';

function setRefreshCookie(res: Response, token: string): void {
  // Parse expiry string to milliseconds for cookie maxAge
  const raw = env.REFRESH_TOKEN_EXPIRY; // e.g. "7d"
  const match = raw.match(/^(\d+)([smhd])$/);
  let maxAgeMs = 7 * 24 * 60 * 60 * 1000; // default 7d
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    maxAgeMs = value * (ms[unit] ?? ms['d']);
  }

  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAgeMs,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

// ─── Controllers ──────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  const ip = req.ip ?? 'unknown';
  const result = await AuthService.registerGetRefreshToken(req.body, ip);

  setRefreshCookie(res, result.refreshToken);

  res.status(201).json(
    successResponse('Account created successfully', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }),
  );
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const ip = req.ip ?? 'unknown';
  const result = await AuthService.login(req.body, ip);

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json(
    successResponse('Login successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }),
  );
}

/**
 * POST /api/auth/logout
 * Requires: verifyAccessTokenMiddleware
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const rawRefreshToken: string | undefined = req.body.refreshToken || req.cookies[REFRESH_COOKIE_NAME];

  await AuthService.logout(userId, rawRefreshToken);

  clearRefreshCookie(res);

  res.status(200).json(successResponse('Logged out successfully', null));
}

/**
 * POST /api/auth/refresh
 * Reads refresh token from HttpOnly cookie.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken: string | undefined = req.body.refreshToken || req.cookies[REFRESH_COOKIE_NAME];

  if (!rawRefreshToken) {
    throw new AuthError('Refresh token not found');
  }

  const tokens = await AuthService.refresh(rawRefreshToken);

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json(
    successResponse('Tokens refreshed successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  );
}

/**
 * GET /api/auth/me
 * Requires: verifyAccessTokenMiddleware
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await AuthService.getMe(req.user!.id);
  res.status(200).json(successResponse('User profile retrieved', { user }));
}
