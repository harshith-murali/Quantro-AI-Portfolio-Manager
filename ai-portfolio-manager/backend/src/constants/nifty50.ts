/**
 * Official list of Nifty 50 Stock Ticker Symbols.
 * All user trades must belong to this set of symbols.
 */
export const NIFTY_50_SYMBOLS = [
  'ADANIENT',
  'ADANIPORTS',
  'APOLLOHOSP',
  'ASIANPAINT',
  'AXISBANK',
  'BAJAJ-AUTO',
  'BAJFINANCE',
  'BAJAJFINSV',
  'BEL',
  'BHARTIARTL',
  'CIPLA',
  'COALINDIA',
  'DRREDDY',
  'EICHERMOT',
  'GRASIM',
  'HCLTECH',
  'HDFCBANK',
  'HDFCLIFE',
  'HINDALCO',
  'HINDUNILVR',
  'ICICIBANK',
  'INFY',
  'INDIGO',
  'ITC',
  'JIOFIN',
  'JSWSTEEL',
  'KOTAKBANK',
  'LT',
  'M&M',
  'MARUTI',
  'NESTLEIND',
  'NTPC',
  'ONGC',
  'POWERGRID',
  'RELIANCE',
  'SBILIFE',
  'SHRIRAMFIN',
  'SBIN',
  'SUNPHARMA',
  'TCS',
  'TATACONSUM',
  'TATAMOTORS',
  'TATASTEEL',
  'TECHM',
  'TITAN',
  'TRENT',
  'ULTRACEMCO',
  'WIPRO',
  // Supporting traditional staples if they dynamically shift
  'BPCL',
  'BRITANNIA',
  'DIVISLAB',
  'HEROMOTOCO',
  'INDUSINDBK',
  'LTIM'
] as const;

export type Nifty50Symbol = typeof NIFTY_50_SYMBOLS[number];

// Fast-lookup set for validation
export const NIFTY_50_SET = new Set<string>(NIFTY_50_SYMBOLS);

import { ETF_SYMBOLS } from './etfs';

// Map of our internal symbol to Yahoo Finance ticker (.NS for NSE)
export const YAHOO_TICKER_MAP: Record<string, string> = {};
for (const sym of NIFTY_50_SYMBOLS) {
  YAHOO_TICKER_MAP[sym] = `${sym}.NS`;
}
for (const sym of ETF_SYMBOLS) {
  YAHOO_TICKER_MAP[sym] = `${sym}.NS`;
}
