import { Request, Response } from 'express';
import { runBacktest, BacktestParams } from '@/services/backtest.service';

export async function executeBacktest(req: Request, res: Response) {
  const symbol = req.query.symbol as string;
  
  if (!symbol) {
    res.status(400).json({ success: false, error: 'Symbol parameter is required' });
    return;
  }

  const shortWindow = req.query.shortWindow ? parseInt(req.query.shortWindow as string, 10) : 20;
  const longWindow = req.query.longWindow ? parseInt(req.query.longWindow as string, 10) : 50;
  const initialCapital = req.query.initialCapital ? parseFloat(req.query.initialCapital as string) : 100000;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  if (isNaN(shortWindow) || isNaN(longWindow) || isNaN(initialCapital)) {
    res.status(400).json({ success: false, error: 'Numeric parameters must be valid numbers' });
    return;
  }

  if (shortWindow >= longWindow) {
    res.status(400).json({ success: false, error: 'shortWindow must be less than longWindow' });
    return;
  }

  const params: BacktestParams = {
    symbol,
    shortWindow,
    longWindow,
    initialCapital,
    startDate,
    endDate
  };

  try {
    const result = await runBacktest(params);

    if (result.error) {
      res.status(result.status || 500).json({ success: false, error: result.error });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Backtest Controller Error:', error);
    res.status(500).json({ success: false, error: 'Unexpected backtest execution failure' });
  }
}
