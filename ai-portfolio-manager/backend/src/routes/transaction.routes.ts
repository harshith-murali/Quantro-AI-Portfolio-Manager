import { Router } from 'express';
import * as TransactionController from '@/controllers/transaction.controller';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { asyncHandler } from '@/middlewares/asyncHandler';

const router = Router();

// Apply global JWT middleware to all transaction/wallet routes
router.use(verifyAccessTokenMiddleware);

// ─── Wallet Routes ───────────────────────────────────────────────

/**
 * @route   POST /wallet/deposit
 * @access  Protected
 */
router.post('/wallet/deposit', asyncHandler(TransactionController.depositCash));

/**
 * @route   POST /wallet/withdraw
 * @access  Protected
 */
router.post('/wallet/withdraw', asyncHandler(TransactionController.withdrawCash));

/**
 * @route   GET /wallet/balance
 * @access  Protected
 */
router.get('/wallet/balance', asyncHandler(TransactionController.getWalletBalance));

// ─── Transaction Routes ──────────────────────────────────────────

/**
 * @route   GET /transactions
 * @access  Protected
 */
router.get('/transactions', asyncHandler(TransactionController.getTransactions));

/**
 * @route   GET /transactions/summary
 * @access  Protected
 */
router.get('/transactions/summary', asyncHandler(TransactionController.getSummary));

/**
 * @route   GET /transactions/:id
 * @access  Protected
 */
router.get('/transactions/:id', asyncHandler(TransactionController.getTransaction));

export default router;
