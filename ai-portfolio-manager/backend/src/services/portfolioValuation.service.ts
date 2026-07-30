import prisma from '@/config/db';
import { getLatestMarketPrice, MarketPrice } from '@/services/marketPrice.service';

type HoldingLike = {
  symbol: string;
  quantity: number;
  totalInvested: unknown;
};

export interface ValuedHolding {
  symbol: string;
  quantity: number;
  totalInvested: number;
  currentPrice: number;
  previousClose: number | null;
  currentValue: number;
  dayChange: number;
  dayChangePercent: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  marketDate: string;
  source: string;
}

export interface PortfolioValuation {
  holdingsCount: number;
  totalInvested: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  totalPnl: number;
  dayChange: number;
  dayChangePercent: number;
  walletBalance: number;
  virtualCash: number;
  missingPriceSymbols: string[];
  priceDataCoveragePercent: number;
  lastMarketDataUpdate: string | null;
  updateStatus: 'COMPLETE' | 'PARTIAL' | 'NO_POSITIONS';
  valuedHoldings: ValuedHolding[];
  dataSource: string;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export async function valueHoldingRows(
  holdings: HoldingLike[],
  priceResolver: (symbol: string) => Promise<MarketPrice> = getLatestMarketPrice,
): Promise<{
  valuedHoldings: ValuedHolding[];
  missingPriceSymbols: string[];
  lastMarketDataUpdate: string | null;
}> {
  const valuedHoldings: ValuedHolding[] = [];
  const missingPriceSymbols: string[] = [];

  for (const holding of holdings) {
    try {
      const price = await priceResolver(holding.symbol);
      const totalInvested = Number(holding.totalInvested);
      const currentValue = holding.quantity * price.price;
      const previousValue = price.previousClose === null ? currentValue : holding.quantity * price.previousClose;
      const dayChange = currentValue - previousValue;
      const unrealizedPnl = currentValue - totalInvested;

      valuedHoldings.push({
        symbol: price.symbol,
        quantity: holding.quantity,
        totalInvested: roundMoney(totalInvested),
        currentPrice: price.price,
        previousClose: price.previousClose,
        currentValue: roundMoney(currentValue),
        dayChange: roundMoney(dayChange),
        dayChangePercent: pct(dayChange, previousValue),
        unrealizedPnl: roundMoney(unrealizedPnl),
        unrealizedPnlPercent: pct(unrealizedPnl, totalInvested),
        marketDate: price.marketDate,
        source: price.source,
      });
    } catch {
      missingPriceSymbols.push(holding.symbol);
    }
  }

  const lastMarketDataUpdate = valuedHoldings
    .map((holding) => holding.marketDate)
    .sort()
    .at(-1) ?? null;

  return { valuedHoldings, missingPriceSymbols, lastMarketDataUpdate };
}

export async function getPortfolioValuation(userId: string): Promise<PortfolioValuation> {
  const [holdings, realizedResult, wallet] = await Promise.all([
    prisma.holding.findMany({ where: { userId } }),
    prisma.trade.aggregate({
      where: { userId, type: 'SELL', realizedPnl: { not: null } },
      _sum: { realizedPnl: true },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  const totalInvested = holdings.reduce((sum, holding) => sum + Number(holding.totalInvested), 0);
  const { valuedHoldings, missingPriceSymbols, lastMarketDataUpdate } = await valueHoldingRows(holdings);
  const currentValue = valuedHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const unrealizedPnl = currentValue - valuedHoldings.reduce((sum, holding) => sum + holding.totalInvested, 0);
  const realizedPnl = Number(realizedResult._sum.realizedPnl ?? 0);
  const dayChange = valuedHoldings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const previousValue = currentValue - dayChange;
  const coverage = holdings.length === 0 ? 100 : (valuedHoldings.length / holdings.length) * 100;

  return {
    holdingsCount: holdings.length,
    totalInvested: roundMoney(totalInvested),
    currentValue: roundMoney(currentValue),
    unrealizedPnl: roundMoney(unrealizedPnl),
    unrealizedPnlPercent: pct(unrealizedPnl, totalInvested),
    realizedPnl: roundMoney(realizedPnl),
    totalPnl: roundMoney(unrealizedPnl + realizedPnl),
    dayChange: roundMoney(dayChange),
    dayChangePercent: pct(dayChange, previousValue),
    walletBalance: wallet ? Number(wallet.balance) : 0,
    virtualCash: wallet ? Number(wallet.balance) : 0,
    missingPriceSymbols,
    priceDataCoveragePercent: Number(coverage.toFixed(2)),
    lastMarketDataUpdate,
    updateStatus: holdings.length === 0 ? 'NO_POSITIONS' : missingPriceSymbols.length > 0 ? 'PARTIAL' : 'COMPLETE',
    valuedHoldings,
    dataSource: 'AWS_S3_OHLCV',
  };
}
