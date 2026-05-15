import { Request, Response } from 'express';
import * as AnalyticsService from '@/services/analytics.service';
import redis from '@/config/redis';
import { successResponse } from '@/utils/ApiResponse';
import { logger } from '@/utils/logger';

const DASHBOARD_CACHE_TTL = 900; // 15 Minutes (15 * 60)

/**
 * Helper executing standard read-through Redis cache orchestration.
 */
async function cacheThrough(
  req: Request,
  res: Response,
  endpointKey: string,
  fetchFn: (userId: string) => Promise<any>
) {
  const userId = req.user!.id;
  const cacheKey = `dashboard:${endpointKey}:${userId}`;

  try {
    // 1. Peek Cache
    const hit = await redis.get(cacheKey);
    if (hit) {
      logger.debug(`Analytics cache hit: ${cacheKey}`);
      return res.status(200).json(successResponse('Data retrieved from cache', JSON.parse(hit)));
    }

    // 2. Compute Fresh Data
    logger.debug(`Analytics cache miss: ${cacheKey}. Computing raw query.`);
    const result = await fetchFn(userId);

    // 3. Write Cache & Return
    await redis.set(cacheKey, JSON.stringify(result), 'EX', DASHBOARD_CACHE_TTL);
    return res.status(200).json(successResponse('Data computed successfully', result));
  } catch (error) {
    logger.error(`Cache-through execution failed for key ${cacheKey}`, { error });
    // Fallback to live fetching if redis is totally dead to prevent API outages
    const result = await fetchFn(userId);
    return res.status(200).json(successResponse('Data computed (Fallback)', result));
  }
}

export async function getSummary(req: Request, res: Response) {
  await cacheThrough(req, res, 'summary', AnalyticsService.getSummary);
}

export async function getPortfolioGrowth(req: Request, res: Response) {
  await cacheThrough(req, res, 'growth', AnalyticsService.getPortfolioGrowth);
}

export async function getSectorAllocation(req: Request, res: Response) {
  await cacheThrough(req, res, 'sectors', AnalyticsService.getSectorAllocation);
}

export async function getTopMovers(req: Request, res: Response) {
  await cacheThrough(req, res, 'movers', AnalyticsService.getTopMovers);
}

export async function getRecentActivity(req: Request, res: Response) {
  await cacheThrough(req, res, 'activity', AnalyticsService.getRecentActivity);
}

export async function getHoldingsTable(req: Request, res: Response) {
  await cacheThrough(req, res, 'holdings', AnalyticsService.getHoldingsTable);
}
