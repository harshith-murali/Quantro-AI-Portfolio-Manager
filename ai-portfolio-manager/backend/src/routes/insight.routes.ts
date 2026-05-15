import { Router } from 'express';
import * as InsightController from '@/controllers/insight.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

// All AI Insight routes are protected
router.use(verifyAccessTokenMiddleware);

/**
 * @route   POST /insights/portfolio-summary
 * @desc    Generate overall portfolio health summary
 * @access  Protected
 */
router.post('/insights/portfolio-summary', asyncHandler(InsightController.getPortfolioSummary));

/**
 * @route   POST /insights/stock/:symbol
 * @desc    Get AI insight on a specific stock holding
 * @access  Protected
 */
router.post('/insights/stock/:symbol', asyncHandler(InsightController.getStockInsight));

/**
 * @route   POST /insights/risk-analysis
 * @desc    Analyse user's portfolio risk based on profile
 * @access  Protected
 */
router.post('/insights/risk-analysis', asyncHandler(InsightController.getRiskAnalysis));

/**
 * @route   POST /insights/ask
 * @desc    Free-form Q&A with the AI advisor
 * @access  Protected
 */
router.post('/insights/ask', asyncHandler(InsightController.askQuestion));

/**
 * @route   GET /insights/history
 * @desc    Get past insight logs for the user
 * @access  Protected
 */
router.get('/insights/history', asyncHandler(InsightController.getInsightHistory));

/**
 * @route   POST /insights/recommendations
 * @desc    Get dynamic AI stock recommendations
 * @access  Protected
 */
router.post('/insights/recommendations', asyncHandler(InsightController.getRecommendations));

export default router;
