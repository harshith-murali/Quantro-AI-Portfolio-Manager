import { Request, Response } from 'express';
import { fetchAndParseRecommendations } from '@/services/ohlcv.service';

export async function getRecommendations(req: Request, res: Response) {
  const symbol = req.query.symbol as string;

  if (!symbol) {
    res.status(400).json({
      success: false,
      error: 'Symbol parameter is required',
    });
    return;
  }

  const result = await fetchAndParseRecommendations(symbol);

  if (result.error) {
    res.status(result.status || 500).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(200).json({
    success: true,
    symbol,
    key: result.key,
    rowCount: result.data ? result.data.length : 0,
    data: result.data || [],
  });
}
