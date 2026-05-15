import { Request, Response } from 'express';
import { getNiftyLatest } from '@/services/ohlcv.service';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { logger } from '@/utils/logger';

/**
 * GET /api/market/nifty
 * Returns latest NIFTYBEES_NS close (NIFTY 50 proxy) + 90-day history.
 * Public endpoint — no auth required for market data.
 */
export async function getNifty(req: Request, res: Response) {
  try {
    const data = await getNiftyLatest();
    res.status(200).json(successResponse('NIFTY 50 data retrieved', data));
  } catch (error) {
    logger.error('Failed to fetch NIFTY data from S3', { error });
    res.status(503).json(errorResponse('Market data temporarily unavailable'));
  }
}
