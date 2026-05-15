import { Request, Response } from 'express';
import { fetchAndParseOHLCV } from '@/services/ohlcv.service';

export async function getMarketData(req: Request, res: Response) {
  const symbol = req.query.symbol as string;

  if (!symbol) {
    res.status(400).json({
      success: false,
      error: 'Symbol parameter is required',
    });
    return;
  }

  const result = await fetchAndParseOHLCV(symbol);

  if (result.error || !result.data) {
    res.status(result.status || 500).json({
      success: false,
      error: result.error,
    });
    return;
  }

  let filteredData = result.data;

  // 1. Sort by date ascending (assuming format YYYY-MM-DD)
  filteredData.sort((a: any, b: any) => a.date.localeCompare(b.date));

  // 2. Extract filter params
  const from = req.query.from as string;
  const to = req.query.to as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
  const latestOnly = req.query.latestOnly === 'true';

  // 3. Apply date range
  if (from || to) {
    filteredData = filteredData.filter((r: any) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }

  // 4. Apply slice constraints
  if (latestOnly) {
    filteredData = filteredData.length > 0 ? [filteredData[filteredData.length - 1]] : [];
  } else if (limit && !isNaN(limit)) {
    filteredData = filteredData.slice(-limit);
  } else if (!from && !to) {
    // Default to latest 100 rows if no filters specified
    filteredData = filteredData.slice(-100);
  }

  res.status(200).json({
    success: true,
    symbol,
    key: result.key,
    totalRows: result.data.length,
    returnedRows: filteredData.length,
    appliedFilters: {
      limit: limit || (latestOnly ? 1 : (!from && !to ? 100 : null)),
      from: from || null,
      to: to || null,
      latestOnly,
    },
    data: filteredData,
  });
}
