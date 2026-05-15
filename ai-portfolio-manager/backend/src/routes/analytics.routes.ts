import { Router } from 'express';
import * as AnalyticsController from '@/controllers/analytics.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

// Apply verify token globally across all analytics/dashboard routes
router.use(verifyAccessTokenMiddleware);

/**
 * @route   GET /dashboard/summary
 * @access  Protected (Read-Only)
 */
router.get('/summary', asyncHandler(AnalyticsController.getSummary));

/**
 * @route   GET /dashboard/portfolio-growth
 * @access  Protected (Read-Only)
 */
router.get('/portfolio-growth', asyncHandler(AnalyticsController.getPortfolioGrowth));

/**
 * @route   GET /dashboard/sector-allocation
 * @access  Protected (Read-Only)
 */
router.get('/sector-allocation', asyncHandler(AnalyticsController.getSectorAllocation));

/**
 * @route   GET /dashboard/top-movers
 * @access  Protected (Read-Only)
 */
router.get('/top-movers', asyncHandler(AnalyticsController.getTopMovers));

/**
 * @route   GET /dashboard/recent-activity
 * @access  Protected (Read-Only)
 */
router.get('/recent-activity', asyncHandler(AnalyticsController.getRecentActivity));

/**
 * @route   GET /dashboard/holdings-table
 * @access  Protected (Read-Only)
 */
router.get('/holdings-table', asyncHandler(AnalyticsController.getHoldingsTable));

export default router;
