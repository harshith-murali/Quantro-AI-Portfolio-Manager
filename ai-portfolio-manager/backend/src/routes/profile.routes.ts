import { Router } from 'express';
import * as ProfileController from '@/controllers/profile.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

// ALL financial profile endpoints require authentication
router.use(verifyAccessTokenMiddleware);

/**
 * @route   POST /api/financial-profile
 * @desc    Create financial profile for authenticated user
 * @access  Protected
 */
router.post('/', asyncHandler(ProfileController.createProfile));

/**
 * @route   GET /api/financial-profile/me
 * @desc    Retrieve logging-in user's profile
 * @access  Protected
 */
router.get('/me', asyncHandler(ProfileController.getMyProfile));

/**
 * @route   PUT /api/financial-profile/me
 * @desc    Update user's profile and recalculate investable amount
 * @access  Protected
 */
router.put('/me', asyncHandler(ProfileController.updateProfile));

export default router;
