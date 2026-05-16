import prisma from '../config/db';
import { logger } from '../utils/logger';
import { fetchOHLCVFromS3ByNewKey } from './ohlcv.service';
import { calculatePortfolioCoverage } from '../lib/portfolioCoverage';
import { Prisma } from '@prisma/client';

export class PnlUpdateService {
  async updateAllUsers(targetDate: Date, availableSymbols: Set<string>) {
    logger.info('PnlUpdateService: Starting batch update', { targetDate });
    
    // 1. Fetch latest prices and previous closes for all available symbols
    const priceMap: Record<string, { current: number, prev: number }> = {};
    for (const sym of availableSymbols) {
      const s3Data = await fetchOHLCVFromS3ByNewKey(sym);
      if (s3Data && s3Data.data && s3Data.data.length > 0) {
        const sorted = s3Data.data.sort((a: any, b: any) => b.date.localeCompare(a.date));
        const current = sorted[0].close;
        const prev = sorted.length > 1 ? sorted[1].close : current;
        priceMap[sym] = { current, prev };
      }
    }

    const users = await prisma.user.findMany({
      include: { holdings: true }
    });

    let successCount = 0;
    let skipCount = 0;

    for (const user of users) {
      if (user.holdings.length === 0) continue;

      // 2. Coverage Check
      const coveragePrices: Record<string, number> = {};
      Object.keys(priceMap).forEach(s => coveragePrices[s] = priceMap[s].current);
      
      const coverage = calculatePortfolioCoverage(user.holdings, coveragePrices);
      if (!coverage.isSufficient) {
        logger.warn(`Skipping user ${user.id} due to low coverage (${coverage.coveragePercent.toFixed(2)}%)`, {
          missing: coverage.missingSymbols
        });
        skipCount++;
        continue;
      }

      // 3. Metrics Calculation
      let totalValue = 0;
      let totalInvested = 0;
      let totalDayChange = 0;

      for (const h of user.holdings) {
        const invested = Number(h.totalInvested);
        const prices = priceMap[h.symbol];
        
        if (prices) {
          const currentVal = Number(h.quantity) * prices.current;
          const prevVal = Number(h.quantity) * prices.prev;
          totalValue += currentVal;
          totalInvested += invested;
          totalDayChange += (currentVal - prevVal);
        } else {
          // Fallback for symbols in the 20% allowed missing gap: use cost basis
          totalValue += invested;
          totalInvested += invested;
        }
      }

      const unrealizedPnl = totalValue - totalInvested;
      const unrealizedPnlPct = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;
      const dayChangePercent = (totalValue - totalDayChange) > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

      // 4. Realized PnL from trades
      const trades = await prisma.trade.aggregate({
        where: { userId: user.id },
        _sum: { realizedPnl: true }
      });
      const realizedPnl = Number(trades._sum.realizedPnl || 0);

      // 5. Historical Returns (7-day / 30-day)
      const sevenDaysAgo = new Date(targetDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(targetDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const history7 = await prisma.portfolioHistory.findFirst({
        where: { userId: user.id, date: { lte: sevenDaysAgo } },
        orderBy: { date: 'desc' }
      });
      const history30 = await prisma.portfolioHistory.findFirst({
        where: { userId: user.id, date: { lte: thirtyDaysAgo } },
        orderBy: { date: 'desc' }
      });

      const sevenDayReturn = history7 ? ((totalValue - Number(history7.totalValue)) / Number(history7.totalValue)) * 100 : null;
      const thirtyDayReturn = history30 ? ((totalValue - Number(history30.totalValue)) / Number(history30.totalValue)) * 100 : null;

      // 6. Persistence
      await prisma.portfolioSummary.upsert({
        where: { userId: user.id },
        update: {
          totalValue,
          totalInvested,
          unrealizedPnl,
          unrealizedPnlPct,
          realizedPnl,
          dayChange: totalDayChange,
          dayChangePercent,
          sevenDayReturn,
          thirtyDayReturn,
          dataCoveragePercent: coverage.coveragePercent,
          updateStatus: coverage.coveragePercent === 100 ? 'COMPLETE' : 'PARTIAL',
          lastPriceUpdate: targetDate
        },
        create: {
          userId: user.id,
          totalValue,
          totalInvested,
          unrealizedPnl,
          unrealizedPnlPct,
          realizedPnl,
          dayChange: totalDayChange,
          dayChangePercent,
          sevenDayReturn,
          thirtyDayReturn,
          dataCoveragePercent: coverage.coveragePercent,
          updateStatus: coverage.coveragePercent === 100 ? 'COMPLETE' : 'PARTIAL',
          lastPriceUpdate: targetDate
        }
      });

      successCount++;
    }

    logger.info('PnlUpdateService: Finished batch update', { successCount, skipCount });
    return { successCount, skipCount };
  }
}
