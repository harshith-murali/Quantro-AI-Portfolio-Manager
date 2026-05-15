import { Router } from 'express';
import * as PortfolioController from '@/controllers/portfolio.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

// ALL portfolio and trade endpoints require authentication
router.use(verifyAccessTokenMiddleware);

// ─── Trade Routes ────────────────────────────────────────────────

/**
 * @route   POST /api/trade/buy
 * @desc    Place a virtual BUY order
 * @access  Protected
 */
router.post('/trade/buy', asyncHandler(PortfolioController.buyStock));

/**
 * @route   POST /api/trade/sell
 * @desc    Place a virtual SELL order
 * @access  Protected
 */
router.post('/trade/sell', asyncHandler(PortfolioController.sellStock));

/**
 * @route   GET /api/trade/history
 * @desc    Get all trades for the logged-in user
 * @access  Protected
 */
router.get('/trade/history', asyncHandler(PortfolioController.getTradeHistory));

// ─── Holdings Routes ─────────────────────────────────────────────

/**
 * @route   GET /api/holdings
 * @desc    Get current holdings for the logged-in user
 * @access  Protected
 */
router.get('/holdings', asyncHandler(PortfolioController.getAllHoldings));

/**
 * @route   GET /api/holdings/:symbol
 * @desc    Get holding for a specific stock symbol
 * @access  Protected
 */
router.get('/holdings/:symbol', asyncHandler(PortfolioController.getHolding));

// ─── Portfolio Routes ────────────────────────────────────────────

/**
 * @route   GET /api/portfolio/summary
 * @desc    Get total portfolio value, invested amount, total P&L
 * @access  Protected
 */
router.get('/portfolio/summary', asyncHandler(PortfolioController.getPortfolioSummary));

/**
 * @route   GET /api/portfolio/history
 * @desc    Get portfolio value over time (for growth chart)
 * @access  Protected
 */
router.get('/portfolio/history', asyncHandler(PortfolioController.getPortfolioHistory));

export default router;
