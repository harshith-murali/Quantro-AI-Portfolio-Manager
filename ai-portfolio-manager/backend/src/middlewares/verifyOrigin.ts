import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import { AuthError } from '@/utils/AppError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function allowedOrigins(): string[] {
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function isLocalDevelopmentOrigin(origin: string): boolean {
  return (
    env.NODE_ENV !== 'production' &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
  );
}

export function verifyOriginMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidate = origin ?? (referer ? new URL(referer).origin : undefined);

  if (!candidate) {
    next(new AuthError('Origin header is required for state-changing requests'));
    return;
  }

  if (allowedOrigins().includes(candidate) || isLocalDevelopmentOrigin(candidate)) {
    next();
    return;
  }

  next(new AuthError('Request origin is not allowed'));
}
