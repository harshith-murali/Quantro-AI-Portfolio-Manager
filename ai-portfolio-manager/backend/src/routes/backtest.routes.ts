import { Router } from 'express';
import * as BacktestController from '@/controllers/backtest.controller';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/backtest
 * @access  Public
 * @desc    Run SMA crossover backtest for a specific symbol
 */
router.get('/', asyncHandler(BacktestController.executeBacktest));

export default router;
