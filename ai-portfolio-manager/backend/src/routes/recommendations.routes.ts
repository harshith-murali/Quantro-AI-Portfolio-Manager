import { Router } from 'express';
import * as RecommendationsController from '@/controllers/recommendations.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/recommendations?symbol=RELIANCE_NS
 * @access  Public
 * @desc    Fetch and parse recommendation data from AWS S3
 */
router.get('/', asyncHandler(RecommendationsController.getRecommendations));

export default router;
