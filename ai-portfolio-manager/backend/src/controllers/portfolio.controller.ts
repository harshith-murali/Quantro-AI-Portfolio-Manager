import { Request, Response } from 'express';
import * as PortfolioService from '@/services/portfolio.service';
import { tradeSchema } from '@/validators/trade.validator';
import { successResponse } from '@/utils/ApiResponse';

// ─── Trades ──────────────────────────────────────────────────────

/**
 * POST /api/trade/buy
 * Places a virtual BUY order.
 */
export async function buyStock(req: Request, res: Response) {
  const userId = req.user!.id;
  
  // Validate input
  const validatedData = tradeSchema.parse(req.body);

  // Execute buy
  const trade = await PortfolioService.executeBuy(userId, validatedData);

  res.status(201).json(
    successResponse('Buy order executed successfully', { trade })
  );
}

/**
 * POST /api/trade/sell
 * Places a virtual SELL order.
 */
export async function sellStock(req: Request, res: Response) {
  const userId = req.user!.id;
  
  // Validate input
  const validatedData = tradeSchema.parse(req.body);

  // Execute sell
  const trade = await PortfolioService.executeSell(userId, validatedData);

  res.status(201).json(
    successResponse('Sell order executed successfully', { trade })
  );
}

/**
 * GET /api/trade/history
 * Gets paginated trade history.
 */
export async function getTradeHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const history = await PortfolioService.getTradeHistory(userId, limit, offset);

  res.status(200).json(
    successResponse('Trade history retrieved successfully', history)
  );
}

// ─── Holdings ────────────────────────────────────────────────────

/**
 * GET /api/holdings
 * Gets all current holdings.
 */
export async function getAllHoldings(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const holdings = await PortfolioService.getHoldings(userId);

  res.status(200).json(
    successResponse('Holdings retrieved successfully', { holdings })
  );
}

/**
 * GET /api/holdings/:symbol
 * Gets holding for a specific symbol.
 */
export async function getHolding(req: Request, res: Response) {
  const userId = req.user!.id;
  const { symbol } = req.params;

  const holding = await PortfolioService.getHoldingBySymbol(userId, symbol);

  res.status(200).json(
    successResponse('Holding retrieved successfully', { holding })
  );
}

// ─── Portfolio ───────────────────────────────────────────────────

/**
 * GET /api/portfolio/summary
 * Gets portfolio total value, invested amount, and P&L.
 */
export async function getPortfolioSummary(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const summary = await PortfolioService.getPortfolioSummary(userId);

  res.status(200).json(
    successResponse('Portfolio summary retrieved successfully', { summary })
  );
}

/**
 * GET /api/portfolio/history
 * Gets historical portfolio snapshots for charting.
 */
export async function getPortfolioHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  
  const history = await PortfolioService.getPortfolioHistory(userId, days);

  res.status(200).json(
    successResponse('Portfolio history retrieved successfully', { history })
  );
}
