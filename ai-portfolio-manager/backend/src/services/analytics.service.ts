import prisma from '@/config/db';
import redis from '@/config/redis';
import { logger } from '@/utils/logger';
import { getSectorForSymbol } from '@/constants/sectors';

/**
 * Simulated pricing aggregator to provide dynamic unrealized PNL
 * using deterministic symbol codes so dashboard outputs match consistently.
 */
function getMockLiveValue(quantity: number, averageBuy: number, symbol: string): number {
  const totalInvested = quantity * averageBuy;
  // Variance between -3% and +6% based on ticker ASCII sum
  const codeSum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const modFactor = (codeSum % 10) - 3; 
  const multiplier = 1 + (modFactor / 100);
  return Number((totalInvested * multiplier).toFixed(2));
}

/**
 * Helper to compute live value using real close prices if available, falling back to mock.
 */
export function getRealLivePrice(quantity: number, averageBuy: number, symbol: string, latestPrices?: Record<string, number>): number {
  if (latestPrices && latestPrices[symbol]) {
    return Number((quantity * latestPrices[symbol]).toFixed(2));
  }
  return getMockLiveValue(quantity, averageBuy, symbol);
}

/**
 * 1. Top-level Portfolio KPIs
 */
export async function getSummary(userId: string) {
  const [holdings, wallet, profile] = await Promise.all([
    prisma.holding.findMany({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
  ]);

  let totalInvested = 0;
  let currentValue = 0;

  holdings.forEach((h) => {
    const invested = Number(h.quantity) * Number(h.averageBuyPrice);
    const liveVal = getMockLiveValue(Number(h.quantity), Number(h.averageBuyPrice), h.symbol);
    totalInvested += invested;
    currentValue += liveVal;
  });

  const totalPnL = currentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalInvested: Number(totalInvested.toFixed(2)),
    currentValue: Number(currentValue.toFixed(2)),
    totalPnL: Number(totalPnL.toFixed(2)),
    totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
    walletBalance: wallet ? Number(wallet.balance) : 0.0,
    totalStocks: holdings.length,
    riskAppetite: profile?.riskAppetite || 'NOT_SET',
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
  const holdings = await prisma.holding.findMany({ where: { userId } });
  const sectorMap: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach((h) => {
    const val = getMockLiveValue(Number(h.quantity), Number(h.averageBuyPrice), h.symbol);
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
  const holdings = await prisma.holding.findMany({ where: { userId } });

  const mapped = holdings.map((h) => {
    const invested = Number(h.quantity) * Number(h.averageBuyPrice);
    const liveVal = getMockLiveValue(Number(h.quantity), Number(h.averageBuyPrice), h.symbol);
    const pnl = liveVal - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      symbol: h.symbol,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
    };
  });

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
  const holdings = await prisma.holding.findMany({
    where: { userId },
    orderBy: { symbol: 'asc' },
  });

  const data = holdings.map((h) => {
    const quantity = Number(h.quantity);
    const avgBuy = Number(h.averageBuyPrice);
    
    const totalCost = quantity * avgBuy;
    const liveVal = getMockLiveValue(quantity, avgBuy, h.symbol);
    const pnl = liveVal - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    return {
      id: h.id,
      symbol: h.symbol,
      sector: getSectorForSymbol(h.symbol),
      quantity,
      averageBuyPrice: avgBuy,
      currentValue: liveVal,
      totalCost: Number(totalCost.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
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
