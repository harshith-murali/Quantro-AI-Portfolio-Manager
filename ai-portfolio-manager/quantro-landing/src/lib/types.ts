export type Signal = "BUY" | "SELL" | "HOLD";
export type RiskAppetite = "LOW" | "MEDIUM" | "HIGH";
export type BacktestStrategy =
  | "RSI_MEAN_REVERSION" | "MACD_CROSSOVER" | "GOLDEN_CROSS"
  | "BB_BOUNCE" | "COMBINED";

export interface UserProfile {
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  financialGoal: string | null;
  riskAppetite: RiskAppetite;
  investableAmount?: number;
  riskScore?: number;
}

export interface StockSignal {
  symbol: string;
  signal: Signal;
  suitabilityScore: number;
  suggestedAllocation: number;
  rsi: number;
  macd: number;
  currentPrice: number;
  changePercent: number;
  rationale?: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
}

export interface PortfolioSnapshot {
  // Real backend fields (from /portfolio/summary)
  holdingsCount?: number;
  totalInvested?: number;
  currentValue?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  totalPnl?: number;
  walletBalance?: number;
  // Legacy aliases (kept for backward compat)
  totalValue?: number;
  unrealisedPnl?: number;
  realisedPnl?: number;
  virtualCash?: number;
  holdings?: Holding[];
  updatedAt?: string;
}

export interface BacktestReport {
  totalReturnPct: number;
  annualisedReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  sharpeRatio: number;
  buyAndHoldReturnPct: number;
  equityCurve: { date: string; value: number }[];
}
