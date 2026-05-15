import { Router } from 'express';
import * as AuthController from '@/controllers/auth.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { authRateLimiter } from '@/middlewares/rateLimiter';

const router = Router();

// All auth routes share the strict rate limiter
router.use(authRateLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', asyncHandler(AuthController.register));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and issue token pair
 * @access  Public
 */
router.post('/login', asyncHandler(AuthController.login));

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke refresh token and invalidate session
 * @access  Protected
 */
router.post('/logout', verifyAccessTokenMiddleware, asyncHandler(AuthController.logout));

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate refresh token and issue new access token
 * @access  Cookie (HttpOnly refresh token)
 */
router.post('/refresh', asyncHandler(AuthController.refresh));

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user's profile
 * @access  Protected
 */
router.get('/me', verifyAccessTokenMiddleware, asyncHandler(AuthController.getMe));

export default router;
