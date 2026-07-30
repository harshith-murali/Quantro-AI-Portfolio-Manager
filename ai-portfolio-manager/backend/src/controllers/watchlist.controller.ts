import { Request, Response } from 'express';
import { z } from 'zod';
import { successResponse } from '@/utils/ApiResponse';
import * as WatchlistService from '@/services/watchlist.service';

const symbolSchema = z.object({
  symbol: z.string().min(1).max(20),
});

export async function list(req: Request, res: Response): Promise<void> {
  const result = await WatchlistService.listWatchlist(req.user!.id);
  res.status(200).json(successResponse('Watchlist retrieved successfully', result));
}

export async function add(req: Request, res: Response): Promise<void> {
  const { symbol } = symbolSchema.parse(req.body);
  const result = await WatchlistService.addWatchlistItem(req.user!.id, symbol);
  res.status(201).json(successResponse('Watchlist item added successfully', result));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { symbol } = symbolSchema.parse(req.params);
  await WatchlistService.removeWatchlistItem(req.user!.id, symbol);
  res.status(200).json(successResponse('Watchlist item removed successfully', null));
}
