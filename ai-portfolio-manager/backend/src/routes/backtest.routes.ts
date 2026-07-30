import { Router } from 'express';
import * as BacktestController from '@/controllers/backtest.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';

const router = Router();

/**
 * @route   GET /api/backtest
 * @access  Protected
 * @desc    Run SMA crossover backtest for a specific symbol
 */
router.use(verifyAccessTokenMiddleware);
router.get('/', asyncHandler(BacktestController.executeBacktest));

export default router;
