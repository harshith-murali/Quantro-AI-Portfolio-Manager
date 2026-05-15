import { Router } from 'express';
import * as OHLCVController from '@/controllers/ohlcv.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/ohlcv?symbol=RELIANCE_NS
 * @access  Public (or apply your auth middleware here if needed)
 * @desc    Fetch and parse OHLCV data from AWS S3
 */
router.get('/', asyncHandler(OHLCVController.getMarketData));

export default router;
