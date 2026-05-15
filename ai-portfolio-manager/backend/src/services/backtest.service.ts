import { fetchAndParseOHLCV } from '@/services/ohlcv.service';

export interface BacktestParams {
  symbol: string;
  shortWindow: number;
  longWindow: number;
  initialCapital: number;
  startDate?: string;
  endDate?: string;
}

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPct: number;
}

export interface EquityPoint {
  date: string;
  close: number;
  shortSma: number | null;
  longSma: number | null;
  signal: 'BUY' | 'SELL' | 'HOLD';
  cash: number;
  shares: number;
  equity: number;
}

export async function runBacktest(params: BacktestParams) {
  const { symbol, shortWindow, longWindow, initialCapital, startDate, endDate } = params;

  // 1. Fetch Data
  const ohlcvResult = await fetchAndParseOHLCV(symbol);
  if (ohlcvResult.error || !ohlcvResult.data) {
    return { error: ohlcvResult.error || 'Failed to load OHLCV data', status: ohlcvResult.status || 500 };
  }

  let data = ohlcvResult.data;

  // 2. Sort and filter
  data.sort((a: any, b: any) => a.date.localeCompare(b.date));

  if (startDate || endDate) {
    data = data.filter((r: any) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }

  if (data.length === 0) {
    return { error: 'No data available for the given date range', status: 400 };
  }

  // 3. Backtest Engine State
  let cash = initialCapital;
  let shares = 0;
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  let currentTrade: Partial<Trade> | null = null;
  let peakEquity = initialCapital;
  let maxDrawdownPct = 0;

  const closes = data.map((d: any) => d.close);

  // Helper to calculate SMA
  const getSma = (index: number, window: number): number | null => {
    if (index < window - 1) return null;
    let sum = 0;
    for (let i = 0; i < window; i++) {
      sum += closes[index - i];
    }
    return sum / window;
  };

  // 4. Execution Loop
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const close = row.close;

    const shortSma = getSma(i, shortWindow);
    const longSma = getSma(i, longWindow);

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    // We only trigger signals if we have enough data for the long SMA
    if (shortSma !== null && longSma !== null) {
      const prevShortSma = getSma(i - 1, shortWindow);
      const prevLongSma = getSma(i - 1, longWindow);

      if (prevShortSma !== null && prevLongSma !== null) {
        const isCrossOver = prevShortSma <= prevLongSma && shortSma > longSma;
        const isCrossUnder = prevShortSma >= prevLongSma && shortSma < longSma;

        if (isCrossOver && shares === 0) {
          // BUY SIGNAL
          signal = 'BUY';
          shares = cash / close; // Fractional shares allowed for simplicity
          cash = 0;
          
          currentTrade = {
            entryDate: row.date,
            entryPrice: close,
            shares: shares,
          };
        } else if (isCrossUnder && shares > 0) {
          // SELL SIGNAL
          signal = 'SELL';
          cash = shares * close;
          
          if (currentTrade) {
            const pnl = cash - (currentTrade.shares! * currentTrade.entryPrice!);
            const pnlPct = (pnl / (currentTrade.shares! * currentTrade.entryPrice!)) * 100;
            
            trades.push({
              entryDate: currentTrade.entryDate!,
              entryPrice: currentTrade.entryPrice!,
              exitDate: row.date,
              exitPrice: close,
              shares: currentTrade.shares!,
              pnl,
              pnlPct,
            });
            currentTrade = null;
          }
          shares = 0;
        }
      }
    }

    // Record equity point
    const currentEquity = cash + (shares * close);
    equityCurve.push({
      date: row.date,
      close,
      shortSma,
      longSma,
      signal,
      cash,
      shares,
      equity: currentEquity,
    });

    // Track Max Drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const currentDrawdown = (peakEquity - currentEquity) / peakEquity;
    if (currentDrawdown > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdown;
    }
  }

  // 5. Close open position at the end of the simulation if needed
  if (shares > 0 && currentTrade) {
    const finalRow = data[data.length - 1];
    const finalClose = finalRow.close;
    
    cash = shares * finalClose;
    const pnl = cash - (currentTrade.shares! * currentTrade.entryPrice!);
    const pnlPct = (pnl / (currentTrade.shares! * currentTrade.entryPrice!)) * 100;
    
    trades.push({
      entryDate: currentTrade.entryDate!,
      entryPrice: currentTrade.entryPrice!,
      exitDate: finalRow.date,
      exitPrice: finalClose,
      shares: currentTrade.shares!,
      pnl,
      pnlPct,
    });
    
    // Update the final equity curve point to reflect the forced sell
    equityCurve[equityCurve.length - 1].signal = 'SELL';
    equityCurve[equityCurve.length - 1].cash = cash;
    equityCurve[equityCurve.length - 1].shares = 0;
    equityCurve[equityCurve.length - 1].equity = cash;
    
    shares = 0;
  }

  // 6. Calculate Metrics
  const endingCapital = cash;
  const totalReturnPct = ((endingCapital - initialCapital) / initialCapital) * 100;
  
  // CAGR Calculation
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  const years = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const cagr = years > 0 ? (Math.pow(endingCapital / initialCapital, 1 / years) - 1) * 100 : 0;

  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const winRatePct = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  return {
    success: true,
    symbol,
    parameters: params,
    summary: {
      totalReturnPct,
      cagr,
      maxDrawdownPct: maxDrawdownPct * 100, // Format as percentage
      winRatePct,
      totalTrades: trades.length,
      endingCapital,
    },
    trades,
    equityCurve,
  };
}
