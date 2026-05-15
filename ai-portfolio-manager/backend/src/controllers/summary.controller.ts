import { Request, Response } from 'express';
import { fetchAndParseSummary } from '@/services/ohlcv.service';

export async function getSummary(req: Request, res: Response) {
  const result = await fetchAndParseSummary();

  if (result.error) {
    res.status(result.status || 500).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(200).json({
    success: true,
    key: result.key,
    rowCount: result.data ? result.data.length : 0,
    data: result.data || [],
  });
}
