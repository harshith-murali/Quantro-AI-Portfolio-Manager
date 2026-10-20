import { Router } from 'express';
import * as AuthController from '@/controllers/auth.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { authRateLimiter, sessionRateLimiter } from '@/middlewares/rateLimiter';
import { createDemo } from '@/controllers/demo.controller';
import { z } from 'zod';
import { requestAccountAction, completeAccountAction } from '@/services/accountAction.service';
import { successResponse } from '@/utils/ApiResponse';

const router = Router();

// Credential and account-creation attempts retain the strict limiter.
router.use(['/demo', '/register', '/login', '/account-action', '/complete-action'], authRateLimiter);
router.use('/refresh', sessionRateLimiter);
router.post('/demo', asyncHandler(createDemo));
router.post('/account-action', asyncHandler(async(req,res)=>{
  const value=z.object({email:z.string().email().max(254),kind:z.enum(['reset','verify'])}).parse(req.body);
  await requestAccountAction(value.email,value.kind);
  res.json(successResponse('If this account exists, a single-use link has been sent.',null));
}));
router.post('/complete-action', asyncHandler(async(req,res)=>{
  const value=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),kind:z.enum(['reset','verify']),password:z.string().max(128).optional()}).parse(req.body);
  await completeAccountAction(value.token,value.kind,value.password);
  res.json(successResponse(value.kind==='reset'?'Password reset. Please sign in again.':'Email verified.',null));
}));

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
