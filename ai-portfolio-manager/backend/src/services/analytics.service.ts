import prisma from '@/config/db';
import redis from '@/config/redis';
import { logger } from '@/utils/logger';
import { getSectorForSymbol } from '@/constants/sectors';
import { getPortfolioValuation } from '@/services/portfolioValuation.service';

/**
 * 1. Top-level Portfolio KPIs
 */
export async function getSummary(userId: string) {
  const [valuation, profile] = await Promise.all([
    getPortfolioValuation(userId),
    prisma.financialProfile.findUnique({ where: { userId } }),
  ]);

  return {
    totalInvested: valuation.totalInvested,
    currentValue: valuation.currentValue,
    totalPnL: valuation.totalPnl,
    totalPnLPercent: valuation.unrealizedPnlPercent,
    dayChange: valuation.dayChange,
    dayChangePercent: valuation.dayChangePercent,
    walletBalance: valuation.walletBalance,
    totalStocks: valuation.holdingsCount,
    riskAppetite: profile?.riskAppetite || 'NOT_SET',
    missingPriceSymbols: valuation.missingPriceSymbols,
    priceDataCoveragePercent: valuation.priceDataCoveragePercent,
    lastMarketDataUpdate: valuation.lastMarketDataUpdate,
    updateStatus: valuation.updateStatus,
  };
}

/**
 * 2. Time-series growth statistics
 */
export async function getPortfolioGrowth(userId: string) {
  const history = await prisma.portfolioHistory.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });

  const data = history.map((h) => ({
    date: h.date.toISOString().split('T')[0],
    value: Number(h.totalValue),
  }));

  return { data };
}

/**
 * 3. Sector-wise allocations (Pie chart friendly)
 */
export async function getSectorAllocation(userId: string) {
  const valuation = await getPortfolioValuation(userId);
  const sectorMap: Record<string, number> = {};
  let totalValue = 0;

  valuation.valuedHoldings.forEach((h) => {
    const val = h.currentValue;
    const sec = getSectorForSymbol(h.symbol);
    sectorMap[sec] = (sectorMap[sec] || 0) + val;
    totalValue += val;
  });

  const data = Object.entries(sectorMap).map(([sector, value]) => ({
    sector,
    value: Number(value.toFixed(2)),
    percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
  }));

  // Sort descending by percent
  data.sort((a, b) => b.percent - a.percent);

  return { data };
}

/**
 * 4. Top performance movers (3 winners, 3 losers)
 */
export async function getTopMovers(userId: string) {
  const valuation = await getPortfolioValuation(userId);
  const mapped = valuation.valuedHoldings.map((h) => ({
    symbol: h.symbol,
    pnl: h.unrealizedPnl,
    pnlPercent: h.unrealizedPnlPercent,
  }));

  // Sort highest to lowest PNL%
  mapped.sort((a, b) => b.pnlPercent - a.pnlPercent);

  const gainers = mapped.filter((m) => m.pnlPercent > 0).slice(0, 3);
  // Reverse slice to capture most negative
  const losers = mapped
    .filter((m) => m.pnlPercent < 0)
    .reverse()
    .slice(0, 3);

  return { gainers, losers };
}

/**
 * 5. Unified feed combining recent transactions and recent trades (max 10 items)
 */
export async function getRecentActivity(userId: string) {
  const [trades, transactions] = await Promise.all([
    prisma.trade.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
      take: 10,
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  interface ActivityItem {
    type: string;
    symbol?: string;
    amount: number;
    date: string;
    timestamp: number;
  }

  const activities: ActivityItem[] = [];

  trades.forEach((t) => {
    activities.push({
      type: t.type, // 'BUY' | 'SELL'
      symbol: t.symbol,
      amount: Number(t.total),
      date: t.tradeDate.toISOString().split('T')[0],
      timestamp: t.tradeDate.getTime(),
    });
  });

  transactions.forEach((txn) => {
    activities.push({
      type: txn.type, // 'DEPOSIT' | 'WITHDRAWAL' | etc
      amount: Number(txn.amount),
      date: txn.createdAt.toISOString().split('T')[0],
      timestamp: txn.createdAt.getTime(),
    });
  });

  // Order combined desc by original time millisecond
  activities.sort((a, b) => b.timestamp - a.timestamp);

  // Trim to total size 10 and prune timestamp before shipping
  const data = activities.slice(0, 10).map(({ timestamp, ...rest }) => rest);

  return { data };
}

/**
 * 6. Complete table records mapped with custom inline PNL computation
 */
export async function getHoldingsTable(userId: string) {
  const [holdings, valuation] = await Promise.all([
    prisma.holding.findMany({ where: { userId }, orderBy: { symbol: 'asc' } }),
    getPortfolioValuation(userId),
  ]);
  const valuedBySymbol = new Map(valuation.valuedHoldings.map((h) => [h.symbol, h]));

  const data = holdings.map((h) => {
    const valued = valuedBySymbol.get(h.symbol);
    return {
      id: h.id,
      symbol: h.symbol,
      sector: getSectorForSymbol(h.symbol),
      quantity: Number(h.quantity),
      averageBuyPrice: Number(h.averageBuyPrice),
      currentPrice: valued?.currentPrice ?? null,
      currentValue: valued?.currentValue ?? null,
      totalCost: Number(Number(h.totalInvested).toFixed(2)),
      pnl: valued?.unrealizedPnl ?? null,
      pnlPercent: valued?.unrealizedPnlPercent ?? null,
      priceStatus: valued ? 'AVAILABLE' : 'MISSING',
      marketDate: valued?.marketDate ?? null,
      updatedAt: h.updatedAt,
    };
  });

  return { data };
}

/**
 * Purge cache command executed when internal state mutates.
 */
export async function invalidateDashboardCache(userId: string) {
  const pattern = `dashboard:*:${userId}`;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Analytics dashboard cache invalidated', { userId, count: keys.length });
    }
  } catch (error) {
    logger.error('Error clearing dashboard redis cache', { userId, error });
  }
}
