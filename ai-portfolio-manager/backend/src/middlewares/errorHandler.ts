import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/utils/AppError';
import { errorResponse } from '@/utils/ApiResponse';
import { logger } from '@/utils/logger';
import { env } from '@/config/env';

/**
 * Centralised Express error handler.
 * Must be registered LAST in the middleware chain (4-argument signature).
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // ─── Zod validation errors ───────────────────────────────────
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.') || 'root';
      errors[key] = [...(errors[key] ?? []), e.message];
    });
    res.status(422).json(errorResponse('Validation failed', errors));
    return;
  }

  // ─── Operational / known errors ──────────────────────────────
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.errors));
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational AppError', { message: err.message, stack: err.stack });
    }
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // ─── Unknown / programmer errors ─────────────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  let message = err.message;

  // Sanitize Prisma or long internal errors
  if (message.includes('Invalid `prisma') || message.includes('\n')) {
    // If it looks like a Prisma stack trace or has newlines, use a generic message
    message = 'A database error occurred while processing your request.';
  }

  res.status(500).json(
    errorResponse(
      env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : message,
    ),
  );
}
