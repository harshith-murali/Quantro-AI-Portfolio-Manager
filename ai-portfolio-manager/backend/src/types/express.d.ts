import { AuthUser } from '@/types/auth.types';

declare global {
  namespace Express {
    interface Request {
      /** Populated by verifyAccessToken middleware after JWT validation */
      user?: AuthUser;
    }
  }
}

export {};
