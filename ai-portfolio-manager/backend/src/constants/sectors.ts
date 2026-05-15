/**
 * Static sector allocations mapping official NIFTY 50 components
 * to their primary industrial sectors.
 */
export const SYMBOL_SECTOR_MAP: Record<string, string> = {
  // Energy & Oil/Gas
  RELIANCE: 'Energy',
  ONGC: 'Energy',
  BPCL: 'Energy',
  NTPC: 'Energy',
  POWERGRID: 'Energy',
  COALINDIA: 'Energy',

  // Information Technology
  TCS: 'IT',
  INFY: 'IT',
  HCLTECH: 'IT',
  WIPRO: 'IT',
  TECHM: 'IT',
  LTIM: 'IT',

  // Banking & Financial Services
  HDFCBANK: 'Banking',
  ICICIBANK: 'Banking',
  AXISBANK: 'Banking',
  SBIN: 'Banking',
  KOTAKBANK: 'Banking',
  INDUSINDBK: 'Banking',
  BAJFINANCE: 'Financial Services',
  BAJAJFINSV: 'Financial Services',
  HDFCLIFE: 'Financial Services',
  SBILIFE: 'Financial Services',
  SHRIRAMFIN: 'Financial Services',
  JIOFIN: 'Financial Services',

  // FMCG & Consumables
  HINDUNILVR: 'FMCG',
  ITC: 'FMCG',
  NESTLEIND: 'FMCG',
  BRITANNIA: 'FMCG',
  TATACONSUM: 'FMCG',

  // Automobile & Transport
  TATAMOTORS: 'Automobile',
  'M&M': 'Automobile',
  MARUTI: 'Automobile',
  EICHERMOT: 'Automobile',
  HEROMOTOCO: 'Automobile',
  'BAJAJ-AUTO': 'Automobile',
  INDIGO: 'Aviation',

  // Healthcare & Pharmaceuticals
  SUNPHARMA: 'Healthcare',
  CIPLA: 'Healthcare',
  DRREDDY: 'Healthcare',
  APOLLOHOSP: 'Healthcare',
  DIVISLAB: 'Healthcare',
  MAXHEALTH: 'Healthcare',

  // Materials, Metal & Mining
  TATASTEEL: 'Metals & Mining',
  JSWSTEEL: 'Metals & Mining',
  HINDALCO: 'Metals & Mining',
  GRASIM: 'Materials',
  ULTRACEMCO: 'Materials',

  // Infrastructure & Engineering
  LT: 'Construction',
  ADANIENT: 'Conglomerates',
  ADANIPORTS: 'Conglomerates',
  BEL: 'Industrial Manufacturing',

  // Consumer Goods & Retail
  TITAN: 'Consumer Durables',
  TRENT: 'Retail',
  ASIANPAINT: 'Consumer Durables',
};

/**
 * Returns primary sector classification for a given ticker symbol.
 * Default fallback: "Other"
 */
export function getSectorForSymbol(symbol: string): string {
  const uSymbol = symbol.toUpperCase().trim();
  return SYMBOL_SECTOR_MAP[uSymbol] || 'Other';
}
