import { Router } from 'express';
import * as SummaryController from '@/controllers/summary.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/summary
 * @access  Public
 * @desc    Fetch and parse summary data from AWS S3
 */
router.get('/', asyncHandler(SummaryController.getSummary));

export default router;
