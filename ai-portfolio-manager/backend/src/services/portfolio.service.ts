import { Prisma } from '@prisma/client';
import prisma from '@/config/db';
import redis from '@/config/redis';
import { AppError, NotFoundError } from '@/utils/AppError';
import { TradeInput } from '@/validators/trade.validator';
import { logger } from '@/utils/logger';
import { 
  processTradeDebit, 
  processTradeCredit, 
  invalidateWalletCache 
} from '@/services/transaction.service';
import { invalidateDashboardCache } from '@/services/analytics.service';
import { getLatestMarketPrice } from '@/services/marketPrice.service';
import { getPortfolioValuation, valueHoldingRows } from '@/services/portfolioValuation.service';

function checkMarketHours() {
  if (process.env.BYPASS_MARKET_HOURS === 'true') return;
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  
  const day = istTime.getDay();
  if (day === 0 || day === 6) {
    throw new AppError("Market is currently closed. Trading hours are 09:15 AM to 03:30 PM IST (Mon-Fri).", 400);
  }
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  if (timeInMinutes < 555 || timeInMinutes > 930) {
    throw new AppError("Market is currently closed. Trading hours are 09:15 AM to 03:30 PM IST (Mon-Fri).", 400);
  }
}

// ─── BUY ─────────────────────────────────────────────────────────
/**
 * Places a virtual BUY order:
 *  1. Creates a Trade record
 *  2. Upserts the Holding (weighted average cost basis)
 *  3. Snapshots portfolio history
 * All wrapped in a transaction for atomicity.
 */
export async function executeBuy(userId: string, input: TradeInput) {
  checkMarketHours();
  const { symbol, quantity } = input;
  const marketPrice = await getLatestMarketPrice(symbol);
  const price = marketPrice.price;
  const total = quantity * price;

  const trade = await prisma.$transaction(async (tx) => {
    // 1. Record the trade
    const trade = await tx.trade.create({
      data: {
        userId,
        symbol,
        type: 'BUY',
        quantity,
        price: new Prisma.Decimal(price),
        total: new Prisma.Decimal(total),
      },
    });

    // 2. Upsert holding with weighted average buy price
    const existing = await tx.holding.findUnique({
      where: { userId_symbol: { userId, symbol } },
    });

    if (existing) {
      // Weighted average: ((oldQty * oldAvg) + (newQty * newPrice)) / (oldQty + newQty)
      const oldTotal = existing.quantity * Number(existing.averageBuyPrice);
      const newTotal = quantity * price;
      const combinedQty = existing.quantity + quantity;
      const newAvg = (oldTotal + newTotal) / combinedQty;

      await tx.holding.update({
        where: { userId_symbol: { userId, symbol } },
        data: {
          quantity: combinedQty,
          averageBuyPrice: new Prisma.Decimal(newAvg),
          totalInvested: new Prisma.Decimal(
            Number(existing.totalInvested) + total,
          ),
        },
      });
    } else {
      await tx.holding.create({
        data: {
          userId,
          symbol,
          quantity,
          averageBuyPrice: new Prisma.Decimal(price),
          totalInvested: new Prisma.Decimal(total),
        },
      });
    }

    // 3. Snapshot portfolio (upsert today's entry)
    await snapshotPortfolio(tx, userId);

    // 4. Process virtual transaction (Debit cash from wallet)
    await processTradeDebit(
      tx,
      userId,
      total,
      trade.id,
      `Bought ${quantity} shares of ${symbol} @ $${price}`
    );

    return trade;
  });

  logger.info('BUY order executed', {
    event: 'trade.buy',
    userId,
    symbol,
    quantity,
    price,
    total,
    marketDate: marketPrice.marketDate,
    priceSource: marketPrice.source,
  });

  // Invalidate caches
  await Promise.all([
    invalidatePortfolioCache(userId),
    invalidateWalletCache(userId),
    invalidateDashboardCache(userId),
  ]);

  return trade;
}

// ─── SELL ────────────────────────────────────────────────────────
/**
 * Places a virtual SELL order:
 *  1. Validates sufficient holdings
 *  2. Creates a Trade record with realized P&L
 *  3. Updates the Holding (reduces quantity, deletes if zero)
 *  4. Snapshots portfolio history
 */
export async function executeSell(userId: string, input: TradeInput) {
  checkMarketHours();
  const { symbol, quantity } = input;
  const marketPrice = await getLatestMarketPrice(symbol);
  const price = marketPrice.price;
  const total = quantity * price;

  const trade = await prisma.$transaction(async (tx) => {
    // 1. Validate holdings
    const holding = await tx.holding.findUnique({
      where: { userId_symbol: { userId, symbol } },
    });

    if (!holding) {
      throw new AppError(`You do not hold any shares of ${symbol}`, 400);
    }

    if (holding.quantity < quantity) {
      throw new AppError(
        `Insufficient holdings. You hold ${holding.quantity} shares of ${symbol} but tried to sell ${quantity}.`,
        400,
      );
    }

    // 2. Calculate realized P&L
    const avgCost = Number(holding.averageBuyPrice);
    const realizedPnl = (price - avgCost) * quantity;

    // 3. Record the trade
    const trade = await tx.trade.create({
      data: {
        userId,
        symbol,
        type: 'SELL',
        quantity,
        price: new Prisma.Decimal(price),
        total: new Prisma.Decimal(total),
        realizedPnl: new Prisma.Decimal(realizedPnl),
      },
    });

    // 4. Update or delete holding
    const remainingQty = holding.quantity - quantity;

    if (remainingQty === 0) {
      await tx.holding.delete({
        where: { userId_symbol: { userId, symbol } },
      });
    } else {
      // Reduce total invested proportionally
      const soldFraction = quantity / holding.quantity;
      const reducedInvestment =
        Number(holding.totalInvested) * (1 - soldFraction);

      await tx.holding.update({
        where: { userId_symbol: { userId, symbol } },
        data: {
          quantity: remainingQty,
          totalInvested: new Prisma.Decimal(reducedInvestment),
        },
      });
    }

    // 5. Snapshot portfolio
    await snapshotPortfolio(tx, userId);

    // 6. Process virtual transaction (Credit cash to wallet + realized P&L settlement)
    await processTradeCredit(
      tx,
      userId,
      total,
      trade.id,
      `Sold ${quantity} shares of ${symbol} @ $${price}`,
      realizedPnl
    );

    return trade;
  });

  logger.info('SELL order executed', {
    event: 'trade.sell',
    userId,
    symbol,
    quantity,
    price,
    total,
    marketDate: marketPrice.marketDate,
    priceSource: marketPrice.source,
    realizedPnl: Number(trade.realizedPnl),
  });

  // Invalidate caches
  await Promise.all([
    invalidatePortfolioCache(userId),
    invalidateWalletCache(userId),
    invalidateDashboardCache(userId),
  ]);

  return trade;
}

// ─── Trade History ───────────────────────────────────────────────
export async function getTradeHistory(
  userId: string,
  limit = 50,
  offset = 0,
) {
  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.trade.count({ where: { userId } }),
  ]);

  return { trades, total, limit, offset };
}

// ─── Holdings ────────────────────────────────────────────────────
export async function getHoldings(userId: string) {
  return prisma.holding.findMany({
    where: { userId },
    orderBy: { symbol: 'asc' },
  });
}

export async function getHoldingBySymbol(userId: string, symbol: string) {
  const holding = await prisma.holding.findUnique({
    where: { userId_symbol: { userId, symbol: symbol.toUpperCase() } },
  });

  if (!holding) {
    throw new NotFoundError(`Holding for ${symbol.toUpperCase()}`);
  }

  return holding;
}

// ─── Portfolio Summary ───────────────────────────────────────────
/**
 * Computes the portfolio summary:
 * - totalInvested: sum of cost basis across all holdings
 * - currentValue: sum of (qty * avgBuyPrice) — in a real app this uses live price
 * - unrealizedPnl: currentValue - totalInvested
 * - realizedPnl: sum of all SELL trade realized P&L
 */
export async function getPortfolioSummary(userId: string) {
  const cacheKey = `portfolio:summary:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const summary = await getPortfolioValuation(userId);

  await redis.set(cacheKey, JSON.stringify(summary), 'EX', 3600); // Cache for 1 hour
  return summary;
}

// ─── Portfolio History ───────────────────────────────────────────
export async function getPortfolioHistory(userId: string, days = 30) {
  const cacheKey = `portfolio:history:${userId}:${days}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const history = await prisma.portfolioHistory.findMany({
    where: {
      userId,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });

  await redis.set(cacheKey, JSON.stringify(history), 'EX', 3600); // Cache for 1 hour
  return history;
}

// ─── Cache Invalidation ──────────────────────────────────────────
async function invalidatePortfolioCache(userId: string) {
  const keys = await redis.keys(`portfolio:*:${userId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ─── Internal: Snapshot Portfolio ────────────────────────────────
/**
 * Upserts today's portfolio snapshot.
 * Called automatically after every trade within the same transaction.
 */
async function snapshotPortfolio(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const holdings = await tx.holding.findMany({ where: { userId } });

  const totalInvested = holdings.reduce(
    (sum, h) => sum + Number(h.totalInvested),
    0,
  );

  const { valuedHoldings } = await valueHoldingRows(holdings);
  const currentValue = valuedHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  const pnl = currentValue - totalInvested;

  // Today at midnight (UTC) for deduplication
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await tx.portfolioHistory.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      totalValue: new Prisma.Decimal(currentValue),
      invested: new Prisma.Decimal(totalInvested),
      pnl: new Prisma.Decimal(pnl),
    },
    create: {
      userId,
      totalValue: new Prisma.Decimal(currentValue),
      invested: new Prisma.Decimal(totalInvested),
      pnl: new Prisma.Decimal(pnl),
      date: today,
    },
  });
}
