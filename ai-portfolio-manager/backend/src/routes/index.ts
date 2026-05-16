import { Router, Request, Response } from 'express';
import authRouter from '@/routes/auth.routes';
import profileRouter from '@/routes/profile.routes';
import portfolioRouter from '@/routes/portfolio.routes';
import transactionRouter from '@/routes/transaction.routes';
import insightRouter from '@/routes/insight.routes';
import analyticsRouter from '@/routes/analytics.routes';
import ohlcvRouter from '@/routes/ohlcv.routes';
import recommendationsRouter from '@/routes/recommendations.routes';
import summaryRouter from '@/routes/summary.routes';
import backtestRouter from '@/routes/backtest.routes';
import marketRouter from '@/routes/market.routes';
import { verifyAccessTokenMiddleware } from '@/middlewares/verifyAccessToken';
import { verifyAdmin } from '@/middlewares/verifyAdmin';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { successResponse } from '@/utils/ApiResponse';

const router = Router();

// ─── Auth routes ──────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─── Profile routes ────────────────────────────────────────────────
router.use('/financial-profile', profileRouter);


// ─── Health check ─────────────────────────────────────────────────
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json(
    successResponse('Quantro API is running', {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    }),
  );
});

// ─── Example: Protected route (User) ─────────────────────────────
router.get(
  '/portfolio',
  verifyAccessTokenMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(
      successResponse('Portfolio data retrieved', {
        userId: req.user!.id,
        message: 'Your AI-powered portfolio dashboard will live here.',
        holdings: [],
        recommendations: [],
      }),
    );
  }),
);

// ─── Example: Admin-only route ────────────────────────────────────
router.get(
  '/admin/users',
  verifyAccessTokenMiddleware,
  verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(
      successResponse('Admin: user list', {
        message: 'Full user management endpoints will live here.',
      }),
    );
  }),
);

// ─── OHLCV Market Data routes ──────────────────────────────────────
router.use('/ohlcv', ohlcvRouter);
router.use('/recommendations', recommendationsRouter);
router.use('/summary', summaryRouter);
router.use('/backtest', backtestRouter);
router.use('/market', marketRouter);

// ─── Portfolio & Trading routes ────────────────────────────────────
router.use('/', portfolioRouter);

// ─── Wallet & Transaction routes ───────────────────────────────────
router.use('/', transactionRouter);

// ─── AI Insights routes ────────────────────────────────────────────
router.use('/', insightRouter);

// ─── Dashboard & Analytics routes ──────────────────────────────────
router.use('/dashboard', analyticsRouter);



export default router;
