import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '@/utils/AppError';
import { Role } from '@prisma/client';

/**
 * Role-based access guard.
 * Must be used AFTER verifyAccessTokenMiddleware (requires req.user).
 *
 * @example
 * router.get('/admin/users', verifyAccessTokenMiddleware, verifyAdmin, handler);
 */
export function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new AuthError('Authentication required'));
    return;
  }

  if (req.user.role !== Role.ADMIN) {
    next(new ForbiddenError('Administrator access required'));
    return;
  }

  next();
}
