import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * HTTP request logger middleware.
 * Logs method, path, status code, response time, and IP on every request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const level =
      statusCode >= 500 ? 'error' :
      statusCode >= 400 ? 'warn' :
      'info';

    logger.log(level, `${method} ${originalUrl} ${statusCode} — ${duration}ms`, {
      event: 'http.request',
      method,
      path: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  });

  next();
}
