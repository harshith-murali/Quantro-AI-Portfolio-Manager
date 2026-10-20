import { NIFTY_50_SET } from '@/constants/nifty50';
import { AppError } from '@/utils/AppError';

export function normalizeSymbol(input: string): string {
  const symbol = input.trim().toUpperCase().replace(/\.NS$/, '').replace(/_NS$/, '');
  // Earlier advisor recommendations used this display name instead of the NSE ticker.
  return symbol === 'LARSEN' ? 'LT' : symbol;
}

export function normalizeSupportedSymbol(input: string): string {
  const symbol = normalizeSymbol(input);
  if (!NIFTY_50_SET.has(symbol)) {
    throw new AppError(`Unsupported stock symbol: ${input}`, 400);
  }
  return symbol;
}

export function symbolToS3Key(symbol: string): string {
  return `ohlcv/${normalizeSupportedSymbol(symbol)}.csv`;
}
