import { Router } from 'express';
import * as MarketController from '@/controllers/market.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/market/nifty
 * @access  Public
 * @desc    Get latest NIFTY 50 data (via NIFTYBEES proxy)
 */
router.get('/nifty', asyncHandler(MarketController.getNifty));

export default router;
